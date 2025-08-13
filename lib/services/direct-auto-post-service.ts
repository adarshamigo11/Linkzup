import mongoose from 'mongoose';
import fetch from 'node-fetch';
import { ISTTime } from '@/lib/utils/ist-time';

interface LinkedInPostData {
  _id: string;
  topicTitle: string;
  content: string;
  imageUrl?: string;
  userLinkedInToken: string;
  userLinkedInId: string;
  scheduledTime: Date;
  status: string;
}

export class DirectAutoPostService {
  private static async connectDB() {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }
  }

  private static async findScheduledPosts(): Promise<LinkedInPostData[]> {
    await this.connectDB();
    
    const now = new Date();
    console.log(`🔍 Looking for scheduled posts at: ${ISTTime.formatIST(now)}`);
    
    // Get the approvedcontents collection directly
    const collection = mongoose.connection.db!.collection("approvedcontents");
    
    const scheduledPosts = await collection.find({
      status: "scheduled",
      scheduledTime: { $lte: now }
    }).toArray();

    console.log(`📋 Found ${scheduledPosts.length} posts due for posting`);
    
    return scheduledPosts.map(post => ({
      _id: post._id.toString(),
      topicTitle: post.topicTitle || "Untitled",
      content: post.content || post.Content || post["generated content"] || "",
      imageUrl: post.imageUrl || post.Image || post.image_url || null,
      userLinkedInToken: post.userLinkedInToken,
      userLinkedInId: post.userLinkedInId,
      scheduledTime: new Date(post.scheduledTime),
      status: post.status
    }));
  }

  private static async postToLinkedIn(post: LinkedInPostData): Promise<{ success: boolean; error?: string; postId?: string }> {
    try {
      console.log(`🚀 Posting to LinkedIn: ${post.topicTitle}`);
      
      // Prepare LinkedIn API request
      const linkedinPayload: any = {
        author: `urn:li:person:${post.userLinkedInId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: post.content },
            shareMediaCategory: 'NONE'
          }
        },
        visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' }
      };

      // Add image if available
      if (post.imageUrl) {
        linkedinPayload.specificContent['com.linkedin.ugc.ShareContent'].shareMediaCategory = 'IMAGE';
        linkedinPayload.specificContent['com.linkedin.ugc.ShareContent'].media = [{
          status: 'READY',
          description: { text: post.topicTitle },
          media: post.imageUrl,
          title: { text: post.topicTitle }
        }];
      }

      console.log(`📤 LinkedIn Payload:`, JSON.stringify(linkedinPayload, null, 2));

      const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${post.userLinkedInToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        },
        body: JSON.stringify(linkedinPayload)
      });

      const result = await response.json() as any;
      console.log(`📥 LinkedIn Response:`, JSON.stringify(result, null, 2));

      if (response.ok && result?.id) {
        console.log(`✅ Successfully posted to LinkedIn: ${result.id}`);
        return { success: true, postId: result.id };
      } else {
        console.error(`❌ LinkedIn API error:`, result);
        return { 
          success: false, 
          error: result.message || result.error?.message || 'LinkedIn API error' 
        };
      }

    } catch (error) {
      console.error(`❌ Error posting to LinkedIn:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  private static async updatePostStatus(postId: string, status: string, linkedinPostId?: string, error?: string) {
    try {
      const collection = mongoose.connection.db!.collection("approvedcontents");
      
      const updateData: any = {
        status: status,
        postedAt: new Date()
      };

      if (linkedinPostId) {
        updateData.linkedinPostId = linkedinPostId;
      }

      if (error) {
        updateData.error = error;
      }

      await collection.updateOne(
        { _id: new mongoose.Types.ObjectId(postId) },
        { $set: updateData }
      );

      console.log(`💾 Updated post ${postId} status to: ${status}`);
    } catch (error) {
      console.error(`❌ Error updating post status:`, error);
    }
  }

  public static async processScheduledPosts(): Promise<{ processed: number; success: number; failed: number }> {
    try {
      console.log('🔄 Starting direct auto-post process...');
      
      const scheduledPosts = await this.findScheduledPosts();
      let successCount = 0;
      let failedCount = 0;

      for (const post of scheduledPosts) {
        console.log(`\n📝 Processing post: ${post.topicTitle}`);
        console.log(`⏰ Scheduled for: ${ISTTime.formatIST(post.scheduledTime)}`);
        
        const result = await this.postToLinkedIn(post);
        
        if (result.success) {
          await this.updatePostStatus(post._id, 'posted', result.postId);
          successCount++;
          console.log(`✅ Post processed successfully: ${post.topicTitle}`);
        } else {
          await this.updatePostStatus(post._id, 'failed', undefined, result.error);
          failedCount++;
          console.log(`❌ Post failed: ${post.topicTitle} - ${result.error}`);
        }
      }

      console.log(`\n📊 Auto-post summary:`);
      console.log(`   Processed: ${scheduledPosts.length}`);
      console.log(`   Success: ${successCount}`);
      console.log(`   Failed: ${failedCount}`);

      return {
        processed: scheduledPosts.length,
        success: successCount,
        failed: failedCount
      };

    } catch (error) {
      console.error('❌ Error in direct auto-post process:', error);
      return { processed: 0, success: 0, failed: 0 };
    }
  }

  public static async getStatus(): Promise<{
    currentTime: string;
    scheduledPosts: number;
    nextScheduledPost: { title: string; scheduledTime: string } | null;
    autoPostActive: boolean;
  }> {
    try {
      await this.connectDB();
      
      const now = new Date();
      const collection = mongoose.connection.db!.collection("approvedcontents");
      
      // Count scheduled posts
      const scheduledCount = await collection.countDocuments({ status: "scheduled" });
      
      // Find next scheduled post
      const nextPost = await collection.findOne(
        { status: "scheduled" },
        { sort: { scheduledTime: 1 } }
      );

      return {
        currentTime: ISTTime.formatIST(now),
        scheduledPosts: scheduledCount,
        nextScheduledPost: nextPost ? {
          title: nextPost.topicTitle || "Untitled",
                      scheduledTime: ISTTime.formatIST(new Date(nextPost.scheduledTime))
        } : null,
        autoPostActive: true
      };

    } catch (error) {
      console.error('❌ Error getting status:', error);
      return {
        currentTime: ISTTime.formatIST(new Date()),
        scheduledPosts: 0,
        nextScheduledPost: null,
        autoPostActive: false
      };
    }
  }
}
