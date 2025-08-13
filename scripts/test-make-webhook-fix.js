const fetch = require("node-fetch")

async function testMakeWebhook() {
  const webhookUrl = "http://localhost:3001/api/make-webhook"

  // Test data that might cause duplicate ID issues
  const testData = {
    email: "pallavimourya99@gmail.com",
    Topic: "Test Topic for Duplicate Fix",
    generated_content: "This is test content to verify the duplicate ID fix is working properly.",
    topicId: "test-topic-123",
    contentType: "storytelling",
    platform: "linkedin",
    status: "generated",
  }

  console.log("🧪 Testing Make.com webhook with duplicate prevention...")

  try {
    // Send first request
    console.log("📤 Sending first request...")
    const response1 = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-make-api-key": process.env.MAKE_API_KEY,
      },
      body: JSON.stringify(testData),
    })

    const result1 = await response1.json()
    console.log("📥 First response:", result1)

    // Send second request with same data (should handle duplicate)
    console.log("📤 Sending duplicate request...")
    const response2 = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-make-api-key": process.env.MAKE_API_KEY,
      },
      body: JSON.stringify(testData),
    })

    const result2 = await response2.json()
    console.log("📥 Second response:", result2)

    // Send third request with slightly different data
    console.log("📤 Sending modified request...")
    const modifiedData = {
      ...testData,
      generated_content: "This is modified test content with different text.",
    }

    const response3 = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-make-api-key": process.env.MAKE_API_KEY,
      },
      body: JSON.stringify(modifiedData),
    })

    const result3 = await response3.json()
    console.log("📥 Third response:", result3)

    console.log("✅ Webhook test completed successfully!")
  } catch (error) {
    console.error("❌ Error testing webhook:", error)
  }
}

// Run the test
testMakeWebhook()
