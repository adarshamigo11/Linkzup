# Schedule for 5 Minutes Feature

## 🎯 New Feature Added

### **Quick Schedule Button**
- **Purpose**: Automatically schedule posts for 5 minutes in the future
- **Button**: "Schedule 5min" - Blue button with clock icon
- **Functionality**: One-click scheduling without manual time selection

## ✅ Changes Made

### **1. New API Endpoint**

#### `app/api/approved-content/[id]/schedule-5min/route.ts`
\`\`\`typescript
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  // ... authentication and validation ...
  
  // Calculate 5 minutes from now
  const now = new Date()
  const scheduledTime = new Date(now.getTime() + 5 * 60 * 1000) // 5 minutes from now
  
  // Update content with scheduled time
  await ApprovedContent.findByIdAndUpdate(params.id, {
    status: "scheduled",
    scheduledTime: scheduledTime,
    scheduledAt: new Date(),
  })
  
  return NextResponse.json({
    success: true,
    message: "Content scheduled for 5 minutes from now",
    scheduledTime: ISTTime.format(scheduledTime),
  })
}
\`\`\`

### **2. Frontend Function**

#### `app/dashboard/approved-content/page.tsx`
\`\`\`typescript
const scheduleFor5Minutes = async (contentId: string) => {
  try {
    const response = await fetch(`/api/approved-content/${contentId}/schedule-5min`, {
      method: "POST",
    })

    if (response.ok) {
      const data = await response.json()
      toast.success(`Content scheduled for 5 minutes from now!`)
      loadContent()
      loadCronStatus()
    } else {
      const error = await response.json()
      toast.error(error.error || "Failed to schedule content")
    }
  } catch (error) {
    console.error("Error scheduling content:", error)
    toast.error("Failed to schedule content")
  }
}
\`\`\`

### **3. Updated UI**

#### Button Layout
\`\`\`tsx
{item.status === "approved" && (
  <>
    <Button 
      size="sm" 
      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
      onClick={() => scheduleFor5Minutes(item._id)}
    >
      <Clock className="w-4 h-4 mr-1" />
      Schedule 5min
    </Button>
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" onClick={() => setSelectedContent(item)}>
          <Calendar className="w-4 h-4 mr-1" />
          Custom Time
        </Button>
      </DialogTrigger>
      {/* Custom scheduling dialog */}
    </Dialog>
    <Button size="sm" variant="outline" onClick={() => postNow(item._id)}>
      <Play className="w-4 h-4 mr-1" />
      Post Now
    </Button>
  </>
)}
\`\`\`

## 🚀 How It Works

### **1. User Experience**
1. User sees approved content with three buttons:
   - **"Schedule 5min"** (Blue) - Quick 5-minute scheduling
   - **"Custom Time"** (Outline) - Manual time selection
   - **"Post Now"** (Outline) - Immediate posting

2. User clicks "Schedule 5min" button
3. System automatically calculates 5 minutes from current time
4. Content status changes to "scheduled"
5. Success message shows scheduled time
6. Auto-posting will happen in 5 minutes

### **2. Technical Flow**
1. Frontend calls `/api/approved-content/[id]/schedule-5min`
2. Backend validates user and content
3. Calculates 5 minutes from current time
4. Updates database with scheduled time
5. Returns success response with formatted time
6. Frontend shows success message and refreshes

### **3. Auto-Posting**
- Cron job runs every minute
- Auto-post service finds scheduled posts
- Posts scheduled for 5 minutes will be posted automatically
- Status changes to "posted" on success

## 🧪 Testing

### **Test Script Created**
- `scripts/test-5min-scheduling.js` - Tests 5-minute scheduling logic
- Verifies time calculation
- Checks auto-post timing

### **Manual Testing Steps**
1. Go to `/dashboard/approved-content`
2. Find an approved post
3. Click "Schedule 5min" button
4. Verify success message
5. Check status changes to "scheduled"
6. Wait 5 minutes for auto-posting
7. Verify post appears on LinkedIn

## 📊 Button Comparison

### **Before**
- Schedule button (opens dialog)
- Post Now button

### **After**
- **Schedule 5min** button (one-click)
- **Custom Time** button (opens dialog)
- **Post Now** button

## 🎉 Benefits

### **1. User Experience**
- ✅ One-click scheduling
- ✅ No manual time selection needed
- ✅ Quick and convenient
- ✅ Clear visual distinction

### **2. Functionality**
- ✅ Automatic 5-minute calculation
- ✅ Proper timezone handling
- ✅ Integration with auto-posting system
- ✅ Error handling and validation

### **3. Technical**
- ✅ Clean API design
- ✅ Reusable code structure
- ✅ Proper error handling
- ✅ Consistent with existing patterns

## 🔧 Usage

### **Quick Scheduling**
- Click "Schedule 5min" for immediate 5-minute scheduling
- Perfect for quick posts without manual time selection

### **Custom Scheduling**
- Click "Custom Time" for specific date/time selection
- Use when you need precise control over posting time

### **Immediate Posting**
- Click "Post Now" for instant LinkedIn posting
- Bypasses scheduling system entirely

The "Schedule 5min" feature provides a quick and convenient way to schedule posts for 5 minutes in the future with just one click! 🎯
