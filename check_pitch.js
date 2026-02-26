require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
    const { data, error } = await supabase.from('pitch_decks').select('id, deck_title, slides_content').limit(3);
    if (error) {
        console.error(error);
        return;
    }

    for (let deck of data) {
        console.log(`\nDeck: ${deck.deck_title} (${deck.id})`);
        console.log(`Slides: ${deck.slides_content?.length}`);
        if (deck.slides_content && deck.slides_content.length > 1) {
            console.log(`Slide 1 (Index 0) moodImage length: ${deck.slides_content[0].moodImage ? deck.slides_content[0].moodImage.length : 'MISSING'}`);
            console.log(`Slide 2 (Index 1) moodImage length: ${deck.slides_content[1].moodImage ? deck.slides_content[1].moodImage.length : 'MISSING'}`);
            console.log(`Slide 2 (Index 1) image_url: ${deck.slides_content[1].image_url || 'MISSING'}`);
        }
    }
}

check();
