// Test Deep Link Functionality
// This file shows how to test the deep link functionality

// Test URLs you can use to test the deep link functionality:

// 1. Test post deep link (replace 123 with an actual post ID)
const testPostLink = "socialz://post/123";

// 2. Test password reset deep link
const testResetLink = "socialz://reset-password";

// Example Share Message Format (Updated):
const exampleShareMessage = `
[Post Title]

[Post Content]

Posted by @username

Your ultimate student networking platform!

📱 Download SocialZ:
Android: https://play.google.com/store/apps/details?id=com.student.app
iOS: https://apps.apple.com/app/socialz/id123456789

🔗 View this post: https://play.google.com/store/apps/details?id=com.student.app

#SocialZ #StudentNetworking #CollegeLife
`;

// ===== TESTING METHODS =====

// Method 1: Using Expo CLI (if using Expo)
// expo start --dev-client
// Then in another terminal:
// npx uri-scheme open "socialz://post/123" --android
// npx uri-scheme open "socialz://post/123" --ios

// Method 2: Using ADB (Android)
// adb shell am start -W -a android.intent.action.VIEW -d "socialz://post/123" com.student.app

// Method 3: Using Xcode Simulator (iOS)
// xcrun simctl openurl booted "socialz://post/123"

// Method 4: Manual testing in app
// 1. Open your app
// 2. Go to browser and type: socialz://post/123
// 3. It should open your app and navigate to the post

// Method 5: Test share functionality
// 1. Share a post from your app
// 2. Check if the share message appears correctly
// 3. Verify the Play Store link is clickable

// Method 6: Test deep link handling
// 1. Install your app
// 2. Use one of the CLI methods above
// 3. App should open and navigate to the post

// ===== SERVER-SIDE DEEP LINK HANDLING WITH SUPABASE =====

// Step 1: Create a Supabase function for deep link handling
const supabaseDeepLinkFunction = `
-- Create a function to handle deep link redirects
CREATE OR REPLACE FUNCTION handle_deep_link(post_id UUID)
RETURNS JSON AS $$
DECLARE
  post_data JSON;
BEGIN
  -- Get post data
  SELECT json_build_object(
    'id', p.id,
    'title', p.title,
    'content', p.content,
    'user_name', u.full_name,
    'username', u.username,
    'created_at', p.created_at
  ) INTO post_data
  FROM posts p
  LEFT JOIN users u ON p.user_id = u.id
  WHERE p.id = post_id;
  
  -- Return post data or error
  IF post_data IS NULL THEN
    RETURN json_build_object('error', 'Post not found');
  ELSE
    RETURN post_data;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create a table to track deep link analytics
CREATE TABLE IF NOT EXISTS deep_link_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id),
  user_id UUID REFERENCES users(id),
  platform VARCHAR(20), -- 'android', 'ios', 'web'
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a function to log deep link visits
CREATE OR REPLACE FUNCTION log_deep_link_visit(
  p_post_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_platform VARCHAR(20) DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO deep_link_analytics (
    post_id, user_id, platform, user_agent, ip_address
  ) VALUES (
    p_post_id, p_user_id, p_platform, p_user_agent, p_ip_address
  );
END;
$$ LANGUAGE plpgsql;
`;

// Step 2: Create a web endpoint for universal links
const universalLinkEndpoint = `
// Example: https://your-domain.com/post/123
// This would redirect to your app or show a web version

// Node.js/Express example:
app.get('/post/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    // Get post data from Supabase
    const { data: post, error } = await supabase
      .from('posts')
      .select(`
        *,
        users!inner(full_name, username)
      `)
      .eq('id', id)
      .single();
    
    if (error || !post) {
      return res.status(404).send('Post not found');
    }
    
    // Log the visit
    await supabase.rpc('log_deep_link_visit', {
      p_post_id: id,
      p_platform: 'web',
      p_user_agent: req.headers['user-agent'],
      p_ip_address: req.ip
    });
    
    // Check if user is on mobile
    const userAgent = req.headers['user-agent'];
    const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
    
    if (isMobile) {
      // Redirect to app with deep link
      res.redirect(\`socialz://post/\${id}\`);
    } else {
      // Show web version
      res.send(\`
        <html>
          <head>
            <title>\${post.title || 'SocialZ Post'}</title>
            <meta property="og:title" content="\${post.title || 'SocialZ Post'}" />
            <meta property="og:description" content="\${post.content}" />
            <meta property="og:type" content="article" />
          </head>
          <body>
            <h1>\${post.title || 'SocialZ Post'}</h1>
            <p>\${post.content}</p>
            <p>Posted by @\${post.users.username}</p>
            <a href="socialz://post/\${id}">Open in SocialZ App</a>
          </body>
        </html>
      \`);
    }
  } catch (error) {
    res.status(500).send('Server error');
  }
});
`;

console.log('🔗 Deep Link Test URLs:');
console.log('Post Link:', testPostLink);
console.log('Reset Link:', testResetLink);
console.log('');
console.log('📱 To test, use one of the methods above');
console.log('');
console.log('📝 Example Share Message:');
console.log(exampleShareMessage);
console.log('');
console.log('🚀 Next Steps:');
console.log('1. Test the deep link functionality using the methods above');
console.log('2. Implement server-side handling with Supabase (see code above)');
console.log('3. Set up universal links for better cross-platform support');
console.log('4. Add analytics tracking for deep link usage'); 