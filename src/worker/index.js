// functions/api/updates.js
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const pathParts = pathname.split('/').filter(Boolean);
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Handle clean URLs
      if (pathParts.length > 0 && !url.searchParams.has('search') && !url.searchParams.has('suggest')) {
        const updateName = pathParts[0].replace(/-/g, ' ');
        url.searchParams.set('search', updateName);
      }

      switch (request.method) {
        case 'GET':
          // Suggestions/autocomplete endpoint
          if (url.searchParams.has('suggest')) {
            const term = url.searchParams.get('suggest')?.toLowerCase() || '';
            
            if (term.length < 2) {
              return new Response(
                JSON.stringify({ suggestions: [] }), 
                { status: 200, headers: corsHeaders }
              );
            }

            const suggestions = await env.DB.prepare(`
              SELECT 
                name,
                up_votes,
                down_votes,
                verdict
              FROM updates
              WHERE LOWER(name) LIKE ?
              ORDER BY 
                CASE 
                  WHEN LOWER(name) = ? THEN 1
                  WHEN LOWER(name) LIKE ? THEN 2
                  ELSE 3
                END,
                name DESC
              LIMIT 5
            `)
            .bind(`%${term}%`, term, `${term}%`)
            .all();

            return new Response(
              JSON.stringify({ suggestions: suggestions.results }), 
              { status: 200, headers: corsHeaders }
            );
          }

          // Search endpoint
          if (url.searchParams.has('search')) {
            const searchTerm = url.searchParams.get('search');

            const result = await env.DB.prepare(`
              SELECT 
                name as update_name,
                up_votes,
                down_votes,
                verdict,
                last_updated
              FROM updates 
              WHERE name = ?
            `)
            .bind(searchTerm)
            .first();

            return new Response(
              JSON.stringify(result || { error: 'Not found' }), 
              { status: result ? 200 : 404, headers: corsHeaders }
            );
          }

          break;

        case 'POST':
          const { name, voteType } = await request.json();
          
          if (!name || !['up', 'down'].includes(voteType)) {
            return new Response(
              JSON.stringify({ error: 'Invalid vote data' }), 
              { status: 400, headers: corsHeaders }
            );
          }

          // Update vote count
          await env.DB.prepare(`
            UPDATE updates 
            SET 
              ${voteType}_votes = ${voteType}_votes + 1,
              verdict = CASE 
                WHEN up_votes + CASE WHEN ? = 'up' THEN 1 ELSE 0 END > 
                     down_votes + CASE WHEN ? = 'down' THEN 1 ELSE 0 END 
                THEN 'UPDATE' 
                ELSE 'WAIT' 
              END,
              last_updated = CURRENT_TIMESTAMP
            WHERE name = ?
          `)
          .bind(voteType, voteType, name)
          .run();

          // Get updated data
          const updated = await env.DB.prepare(`
            SELECT 
              name as update_name,
              up_votes,
              down_votes,
              verdict,
              last_updated
            FROM updates
            WHERE name = ?
          `)
          .bind(name)
          .first();

          return new Response(
            JSON.stringify(updated), 
            { status: 200, headers: corsHeaders }
          );

          break;

        default:
          return new Response(
            JSON.stringify({ error: 'Method not allowed' }), 
            { status: 405, headers: corsHeaders }
          );
      }
    } catch (error) {
      console.error('Error:', error);
      return new Response(
        JSON.stringify({ error: error.message }), 
        { status: 500, headers: corsHeaders }
      );
    }
  }
}