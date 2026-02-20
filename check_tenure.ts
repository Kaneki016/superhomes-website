
import sql from './lib/db';

async function checkTenure() {
    console.log('Checking tenure distribution for projects...');
    try {
        const projectCounts = await sql`
            SELECT 
                lpd.tenure, 
                COUNT(*) as count
            FROM listing_project_details lpd
            JOIN listings l ON l.id = lpd.listing_id
            WHERE l.is_active = true
            GROUP BY lpd.tenure
            ORDER BY count DESC
        `;

        console.log('Tenure counts for active projects:');
        console.table(projectCounts);

        const nullTenureCount = await sql`
            SELECT count(*) 
            FROM listing_project_details lpd
            JOIN listings l ON l.id = lpd.listing_id
            WHERE l.is_active = true AND lpd.tenure IS NULL
        `;
        console.log('Projects with NULL tenure:', nullTenureCount[0].count);

    } catch (error) {
        console.error('Error querying database:', error);
    }
    process.exit(0);
}

checkTenure();
