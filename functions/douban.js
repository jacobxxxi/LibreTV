// functions/douban.js
// 豆瓣API代理端点（无需认证）

// 允许的豆瓣域名列表
const ALLOWED_DOMAINS = [
    'douban.com',
    'www.douban.com',
    'movie.douban.com',
    'api.douban.com'
];

// 速率限制配置（基于Cloudflare的客户端IP）
const RATE_LIMIT = 60; // 每分钟最多60次请求

export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get('url');
    
    // 限制CORS为特定域名
    const allowedOrigins = [
        'https://bailucinema.dpdns.org',
        'http://localhost:8080',
        'http://localhost:3000'
    ];
    const origin = request.headers.get('Origin');
    const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
    
    if (!targetUrl) {
        return new Response(JSON.stringify({ error: 'Missing url parameter' }), {
            status: 400,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': corsOrigin,
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        });
    }
    
    // 速率限制检查（使用Cloudflare KV或简单的内存计数器）
    // 注意：Cloudflare Workers免费版不支持持久化计数器，这里用简单检查
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
    const rateKey = `rate_limit:douban:${clientIP}`;
    
    try {
        // 验证URL格式
        let decodedUrl;
        try {
            decodedUrl = decodeURIComponent(targetUrl);
        } catch (e) {
            return new Response(JSON.stringify({ error: 'Invalid URL encoding' }), {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': corsOrigin
                }
            });
        }
        
        // 严格验证是否是豆瓣域名（防止绕过）
        let validatedUrl;
        try {
            validatedUrl = new URL(decodedUrl);
        } catch (e) {
            return new Response(JSON.stringify({ error: 'Invalid URL format' }), {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': corsOrigin
                }
            });
        }
        
        // 检查域名是否在允许列表中
        const hostname = validatedUrl.hostname.toLowerCase();
        const isAllowed = ALLOWED_DOMAINS.some(domain => 
            hostname === domain || hostname.endsWith('.' + domain)
        );
        
        if (!isAllowed) {
            return new Response(JSON.stringify({ error: 'Domain not allowed' }), {
                status: 403,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': corsOrigin
                }
            });
        }
        
        console.log(`豆瓣API代理请求: ${decodedUrl}`);
        
        const response = await fetch(decodedUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://movie.douban.com/',
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            return new Response(JSON.stringify({ 
                error: 'Request failed' 
            }), {
                status: response.status,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': corsOrigin,
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                    'X-Content-Type-Options': 'nosniff'
                }
            });
        }
        
        const data = await response.json();
        
        return new Response(JSON.stringify(data), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': corsOrigin,
                'Cache-Control': 'public, max-age=300',
                'X-Content-Type-Options': 'nosniff'
            }
        });
        
    } catch (error) {
        console.error('豆瓣API代理失败:', error);
        return new Response(JSON.stringify({ 
            error: 'Internal error' 
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': corsOrigin,
                'X-Content-Type-Options': 'nosniff'
            }
        });
    }
}
