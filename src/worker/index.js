export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
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
      switch (request.method) {
        case 'GET':
          // Check if this is a suggestions request
          if (url.searchParams.has('suggest')) {
            const term = url.searchParams.get('suggest')?.toLowerCase() || '';
            
            if (term.length < 2) {
              return new Response(
                JSON.stringify({ suggestions: [] }), 
                { status: 200, headers: corsHeaders }
              );
            }

            // Get all matching items for suggestions
            const suggestions = await env.DB.prepare(
              `SELECT name, verdict, up_votes, down_votes 
               FROM updates 
               WHERE LOWER(name) LIKE ? 
               ORDER BY 
                CASE 
                  WHEN LOWER(name) = ? THEN 1
                  WHEN LOWER(name) LIKE ? THEN 2
                  ELSE 3
                END,
                (up_votes + down_votes) DESC
               LIMIT 5`
            )
            .bind(`%${term}%`, term, `${term}%`)
            .all();

            return new Response(
              JSON.stringify({ suggestions: suggestions.results }), 
              { status: 200, headers: corsHeaders }
            );
          }

          // Regular search - now requires exact match
          const searchTerm = url.searchParams.get('search')?.toLowerCase();
          if (!searchTerm) {
            return new Response(
              JSON.stringify({ error: 'Search term required' }), 
              { status: 400, headers: corsHeaders }
            );
          }

          const result = await env.DB.prepare(
            `SELECT * FROM updates WHERE LOWER(name) = ?`
          )
          .bind(searchTerm)
          .first();

          return new Response(
            JSON.stringify(result || { error: 'Not found' }), 
            { status: result ? 200 : 404, headers: corsHeaders }
          );
  
          case 'POST':
            const { name, voteType } = await request.json();
            
            if (!name || !voteType || !['up', 'down'].includes(voteType)) {
              return new Response(
                JSON.stringify({ error: 'Valid name and vote type (up/down) required' }), 
                { status: 400, headers: corsHeaders }
              );
            }
  
            // Check if entry exists
            const existingEntry = await env.DB.prepare(
              `SELECT * FROM updates WHERE name = ?`
            )
            .bind(name)
            .first();
  
            if (!existingEntry) {
              // Create new entry
              await env.DB.prepare(
                `INSERT INTO updates (name, up_votes, down_votes, verdict) 
                 VALUES (?, ?, ?, ?)`
              )
              .bind(
                name,
                voteType === 'up' ? 1 : 0,
                voteType === 'down' ? 1 : 0,
                voteType === 'up' ? 'UPDATE' : 'WAIT'
              )
              .run();
            } else {
              // Update existing entry
              await env.DB.prepare(
                `UPDATE updates 
                 SET ${voteType}_votes = ${voteType}_votes + 1,
                 verdict = CASE 
                   WHEN up_votes + CASE WHEN ? = 'up' THEN 1 ELSE 0 END > 
                        down_votes + CASE WHEN ? = 'down' THEN 1 ELSE 0 END 
                   THEN 'UPDATE' ELSE 'WAIT' END,
                 last_updated = CURRENT_TIMESTAMP
                 WHERE name = ?`
              )
              .bind(voteType, voteType, name)
              .run();
            }
  
            // Get updated entry
            const updatedEntry = await env.DB.prepare(
              `SELECT * FROM updates WHERE name = ?`
            )
            .bind(name)
            .first();
  
            return new Response(
              JSON.stringify(updatedEntry), 
              { status: 200, headers: corsHeaders }
            );
  
          default:
            return new Response(
              JSON.stringify({ error: 'Method not allowed' }), 
              { status: 405, headers: corsHeaders }
            );
          }
        } catch (error) {
          return new Response(
            JSON.stringify({ error: error.message }), 
            { status: 500, headers: corsHeaders }
          );
        }
      }
    }