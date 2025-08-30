import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

async function testOpenAI() {
    console.log('🔍 OpenAI API Test Başlıyor...');
    console.log('API Key:', process.env.OPENAI_API_KEY ? '✅ Mevcut' : '❌ Eksik');
    
    if (!process.env.OPENAI_API_KEY) {
        console.error('❌ OPENAI_API_KEY bulunamadı!');
        return;
    }

    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });

    try {
        // 1. Basit chat completion testi
        console.log('\n📝 Chat Completion Test...');
        const chatResponse = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: "Merhaba, bu bir test mesajıdır." }],
            max_tokens: 50
        });
        console.log('✅ Chat Completion başarılı:', chatResponse.choices[0].message.content);

        // 2. TTS testi
        console.log('\n🔊 TTS Test...');
        const ttsResponse = await openai.audio.speech.create({
            model: "tts-1",
            voice: "alloy",
            input: "Bu bir test sesidir."
        });
        console.log('✅ TTS başarılı, ses dosyası oluşturuldu');

        // 3. Realtime API testi (beta)
        console.log('\n🎤 Realtime API Test...');
        try {
            const realtimeSession = await openai.beta.realtime.sessions.create({
                model: "gpt-4o-realtime-preview",
                voice: "alloy",
                instructions: "Sen bir test asistanısın.",
                modalities: ["text", "audio"],
                turn_detection: {
                    type: "server_vad",
                    threshold: 0.5,
                    silence_duration_ms: 500
                }
            });
            console.log('✅ Realtime Session oluşturuldu:', {
                model: realtimeSession.model,
                hasClientSecret: !!realtimeSession.client_secret
            });
        } catch (realtimeError) {
            console.log('⚠️ Realtime API hatası (beta olduğu için normal):', realtimeError.message);
        }

        console.log('\n🎉 OpenAI API testleri tamamlandı!');

    } catch (error) {
        console.error('❌ OpenAI API hatası:', error.message);
        if (error.status) {
            console.error('Status:', error.status);
        }
        if (error.response) {
            console.error('Response:', error.response.data);
        }
    }
}

testOpenAI();
