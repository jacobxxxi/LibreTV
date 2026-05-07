// functions/douban.js
// 豆瓣API代理端点（无需认证）

export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get('url');
    
    if (!targetUrl) {
        return new Response(JSON.stringify({ error: 'Missing url parameter' }), {
            status: 400,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
    
    try {
        const decodedUrl = decodeURIComponent(targetUrl);
        
        // 验证是否是豆瓣API
        if (!decodedUrl.includes('douban.com') && !decodedUrl.includes('movie.douban')) {
            return new Response(JSON.stringify({ error: 'Only douban API allowed' }), {
                status: 403,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
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
                error: `Douban API error: ${response.status}` 
            }), {
                status: response.status,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }
        
        const data = await response.json();
        
        return new Response(JSON.stringify(data), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=300'
            }
        });
        
    } catch (error) {
        console.error('豆瓣API代理失败:', error);
        return new Response(JSON.stringify({ 
            error: `Proxy error: ${error.message}` 
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}
