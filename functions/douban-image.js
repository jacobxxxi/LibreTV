// functions/douban-image.js
// 豆瓣图片代理端点（无需认证，绕过防盗链）

// 允许的豆瓣图片域名
const ALLOWED_IMAGE_DOMAINS = [
    'doubanio.com',
    'douban.com',
    'img1.doubanio.com',
    'img2.doubanio.com',
    'img3.doubanio.com',
    'img9.doubanio.com'
];

// 允许的CORS域名
const ALLOWED_ORIGINS = [
    'https://bailucinema.dpdns.org',
    'http://localhost:8080',
    'http://localhost:3000'
];

export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    
    // 设置CORS头
    const origin = request.headers.get('Origin');
    const corsOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
    
    const imageUrl = url.searchParams.get('url');
    
    if (!imageUrl) {
        return new Response('Bad Request', { status: 400 });
    }
    
    try {
        const decodedUrl = decodeURIComponent(imageUrl);
        
        // 严格验证URL
        let validatedUrl;
        try {
            validatedUrl = new URL(decodedUrl);
        } catch (e) {
            return new Response('Invalid URL', { status: 400 });
        }
        
        // 检查域名是否在允许列表中
        const hostname = validatedUrl.hostname.toLowerCase();
        const isAllowed = ALLOWED_IMAGE_DOMAINS.some(domain => 
            hostname === domain || hostname.endsWith('.' + domain)
        );
        
        if (!isAllowed) {
            return new Response('Forbidden', { status: 403 });
        }
        
        console.log(`豆瓣图片代理请求: ${decodedUrl}`);
        
        const response = await fetch(decodedUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://movie.douban.com/'
            }
        });
        
        if (!response.ok) {
            return new Response('Fetch failed', { 
                status: response.status 
            });
        }
        
        // 返回图片，设置缓存和安全头
        const headers = new Headers();
        headers.set('Content-Type', response.headers.get('Content-Type') || 'image/jpeg');
        headers.set('Cache-Control', 'public, max-age=86400'); // 缓存1天
        headers.set('Access-Control-Allow-Origin', corsOrigin);
        headers.set('X-Content-Type-Options', 'nosniff');
        headers.set('X-Frame-Options', 'SAMEORIGIN');
        
        return new Response(response.body, { headers });
        
    } catch (error) {
        console.error('豆瓣图片代理失败:', error);
        return new Response('Internal error', { status: 500 });
    }
}
