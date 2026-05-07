// functions/douban-image.js
// 豆瓣图片代理端点（无需认证，绕过防盗链）

export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const imageUrl = url.searchParams.get('url');
    
    if (!imageUrl) {
        return new Response('Missing url parameter', { status: 400 });
    }
    
    try {
        const decodedUrl = decodeURIComponent(imageUrl);
        
        // 验证是否是豆瓣图片
        if (!decodedUrl.includes('doubanio.com') && !decodedUrl.includes('douban.com')) {
            return new Response('Only douban images allowed', { status: 403 });
        }
        
        console.log(`豆瓣图片代理请求: ${decodedUrl}`);
        
        const response = await fetch(decodedUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://movie.douban.com/'
            }
        });
        
        if (!response.ok) {
            return new Response(`Image fetch failed: ${response.status}`, { 
                status: response.status 
            });
        }
        
        // 返回图片，设置缓存
        const headers = new Headers();
        headers.set('Content-Type', response.headers.get('Content-Type') || 'image/jpeg');
        headers.set('Cache-Control', 'public, max-age=86400'); // 缓存1天
        headers.set('Access-Control-Allow-Origin', '*');
        
        return new Response(response.body, { headers });
        
    } catch (error) {
        console.error('豆瓣图片代理失败:', error);
        return new Response(`Image proxy error: ${error.message}`, { status: 500 });
    }
}
