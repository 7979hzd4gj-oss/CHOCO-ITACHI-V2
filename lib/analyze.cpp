module.exports = {
    command: 'analyse',
    aliases: ['analyze', 'textanalyse', 'chocoanalyse'],
    category: 'tools',
    description: 'Analyse un texte comme ton programme C++',
    usage: '.analyse ton texte ici',

    async handler(sock, message, args, context) {
        const chatId = context.chatId;
        const text = args.join(' ');
        
        if (!text) {
            return await sock.sendMessage(chatId, { 
                text: '🍫 Envoie un texte ! Ex: *.analyse je suis très heureux aujourd\'hui*' 
            }, { quoted: message });
        }

        // Tokenize comme en C++
        const words = text.toLowerCase().match(/[a-zà-ÿ']{3,}/g) || [];
        const totalWords = words.length;
        const uniqueWords = [...new Set(words)].length;
        const totalChars = text.length;
        const totalCharsNoSpaces = text.replace(/\s/g, '').length;
        const sentences = (text.match(/[.!?]/g) || []).length || 1;
        const paragraphs = text.split('\n\n').filter(p => p.trim()).length || 1;
        const avgWordLen = totalWords ? (words.join('').length / totalWords).toFixed(1) : 0;
        const avgSentenceLen = (totalWords / sentences).toFixed(1);
        const longWords = words.filter(w => w.length > 6).length;
        
        // Reading time (200 wpm)
        const secs = Math.round((totalWords / 200) * 60);
        const readingTime = secs < 60 ? `${secs}s` : `${Math.floor(secs/60)}m ${secs%60}s`;
        
        // Sentiment comme ton C++
        const POSITIVE = ['good','great','excellent','amazing','wonderful','fantastic','love','happy','joy','best','awesome','bon','bien','heureux','joie','super','génial','parfait','aime','content'];
        const NEGATIVE = ['bad','terrible','awful','hate','fail','sad','angry','mauvais','horrible','déteste','triste','colère','nul','merde','mal'];
        
        let pos = 0, neg = 0;
        words.forEach(w => {
           