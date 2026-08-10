const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

async function fetchWordOfTheDay() {
    try {
        // The HTML page is behind a Cloudflare JS challenge; the RSS feed is not.
        const response = await axios.get('https://www.merriam-webster.com/wotd/feed/rss2', {
            headers: { 'User-Agent': 'Mozilla/5.0' },
        });
        const itemMatch = response.data.match(/<item>([\s\S]*?)<\/item>/);
        if (!itemMatch) throw new Error('No item found in word-of-the-day feed');
        const item = itemMatch[1];

        const wordMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/);
        const defMatch = item.match(/<merriam:shortdef><!\[CDATA\[(.*?)\]\]><\/merriam:shortdef>/);
        if (!wordMatch || !defMatch) throw new Error('Could not parse word-of-the-day feed item');

        // Part of speech sits between the pronunciation and the definition, e.g. "...\ked-uh-GAH...\ • <em>adjective</em><br"
        const speechMatch = item.match(/&#149;\s*<em>([^<]+)<\/em>\s*<br/);

        return {
            word: wordMatch[1].trim(),
            speech: speechMatch ? speechMatch[1].trim() : 'unknown',
            definition: defMatch[1].trim(),
        };
    } catch (error) {
        console.error('Error fetching word of the day:', error);
        return { word: 'N/A', speech: 'N/A', definition: 'Unable to fetch word of the day' };
    }
}

async function fetchRandomQuestion() {
    try {
        // The generator page now renders client-side from this plain-text list; there is no
        // server-rendered question to scrape from the page HTML anymore.
        const response = await axios.get('https://conversationstartersworld.com/wp-content/uploads/csw-questions.txt', {
            headers: { 'User-Agent': 'Mozilla/5.0' },
        });
        const questions = response.data.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
        if (!questions.length) throw new Error('No questions found in feed');

        let question = questions[Math.floor(Math.random() * questions.length)];
        if (question.length > 1024) {
            question = question.substring(0, 1021) + '...';
        }
        return question;
    } catch (error) {
        console.error('Error fetching random question:', error);
        return 'What\'s something new you learned today?';
    }
}

async function fetchDailyQuote() {
    try {
        const response = await axios.get('https://zenquotes.io/api/random');
        const data = response.data;
        return `${data[0].q} - ${data[0].a}`;
    } catch (error) {
        console.error('Error fetching daily quote:', error);
        return 'The best time to plant a tree was 20 years ago. The second best time is now. - Unknown';
    }
}

async function fetchTodayInHistory() {
    try {
        const today = new Date();
        const month = today.getMonth() + 1;
        const day = today.getDate();
        
        const response = await axios.get(`https://history.muffinlabs.com/date/${month}/${day}`);
        const data = response.data;
        
        if (data.data && data.data.Events && data.data.Events.length > 0) {
            const event = data.data.Events[0];
            return `${event.year}: ${event.text}`;
        }
        return 'No historical events found for today';
    } catch (error) {
        console.error('Error fetching today in history:', error);
        return 'Unable to fetch historical events for today';
    }
}

async function fetchRandomFact() {
    try {
        const response = await axios.get('https://uselessfacts.jsph.pl/random.json?language=en');
        const data = response.data;
        return data.text;
    } catch (error) {
        console.error('Error fetching random fact:', error);
        return 'A group of flamingos is called a flamboyance.';
    }
}

async function fetchDailyJoke() {
    try {
        const response = await axios.get('https://v2.jokeapi.dev/joke/Any');
        const data = response.data;
        
        if (data.type === 'single') {
            return data.joke;
        } else {
            return `${data.setup} - ${data.delivery}`;
        }
    } catch (error) {
        console.error('Error fetching daily joke:', error);
        return 'Why don\'t scientists trust atoms? Because they make up everything!';
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('memo')
        .setDescription('Post the daily memorandum with curated content'),
    async execute(interaction) {
        // Check if user has Facilitator role
        const facilitatorRole = interaction.guild.roles.cache.find(role => role.name === 'Facilitator');
        if (!facilitatorRole || !interaction.member.roles.cache.has(facilitatorRole.id)) {
            return interaction.reply({ content: 'Only a <@&709389579651645502> can use this command.', ephemeral: true });
        }

        await interaction.deferReply();

        try {
            // Fetch all content
            const [wordData, question, quote, history, fact, joke] = await Promise.all([
                fetchWordOfTheDay(),
                fetchRandomQuestion(),
                fetchDailyQuote(),
                fetchTodayInHistory(),
                fetchRandomFact(),
                fetchDailyJoke()
            ]);

            const today = new Date().toISOString().split('T')[0];

            // Create embed
            const embed = new EmbedBuilder()
                .setTitle('DAILY MEMORANDUM')
                .setDescription(`SUBJECT: ${today}`)
                .setColor(0xFFFF88)
                .addFields(
                    { name: '**Daily Curiosity**', value: `${question}\n\n`, inline: true },
                    { name: '**Word of the Day**', value: `${wordData.word} *(${wordData.speech})* \n${wordData.definition}\n\n🧠 *Try using \'${wordData.word}\' in a sentence today.*\n\n`, inline: false },
                    { name: '**Inspirational Quote**', value: quote, inline: false },
                    { name: '**Today in History**', value: history, inline: false },
                    { name: '**Random Fact**', value: fact, inline: false },
                    { name: '**Daily Joke**', value: joke, inline: false }
                );

            // Find the target channel (using the ID from the original Python code)
            const targetChannel = interaction.guild.channels.cache.get('708336363757371396');
            
            if (targetChannel) {
                await targetChannel.send({ embeds: [embed] });
                await interaction.editReply({ content: 'Daily memorandum posted successfully!', ephemeral: true });
            } else {
                await interaction.editReply({ content: 'Could not find the target channel for posting the memorandum.', ephemeral: true });
            }

        } catch (error) {
            console.error('Error executing memo command:', error);
            await interaction.editReply({ content: 'There was an error creating the daily memorandum.', ephemeral: true });
        }
    },
};