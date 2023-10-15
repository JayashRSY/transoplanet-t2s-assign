import React, { useState, useEffect } from 'react';


const useAudioChunks = () => {
    const [audioChunks, setAudioChunks] = useState([]);

    useEffect(() => {
        const handleAudioAvailable = (e) => {
            if (e.data && e.data.length > 0) {
                setAudioChunks((prevChunks) => [...prevChunks, ...e.data]);
            }
        };

        window.addEventListener('message', handleAudioAvailable);

        return () => {
            window.removeEventListener('message', handleAudioAvailable);
        };
    }, []);

    return { audioChunks, setAudioChunks };
};
const TextToSpeech = () => {
    const [sourceText, setSourceText] = useState('');
    const [translatedText, setTranslatedText] = useState('');
    const [targetLang, setTargetLang] = useState('');

    const [isSpeaking, setIsSpeaking] = useState(false);
    const { audioChunks, setAudioChunks } = useAudioChunks();
    const [isDownloadAvailable, setIsDownloadAvailable] = useState(false);

    const handleTranslate = async () => {
        const sourceLang = 'en';
        let targetLang = 'hi';
        const url =
            'https://translate.googleapis.com/translate_a/single?client=gtx&sl=' +
            sourceLang +
            '&tl=' +
            targetLang +
            '&dt=t&q=' +
            encodeURI(sourceText);

        try {
            const response = await fetch(url);
            const data = await response.json();
            const translatedText = data[0][0][0];
            setTranslatedText(translatedText);
        } catch (error) {
            console.log('Error occurred during translation:', error);
        }
    };

    const handleInputChange = (e) => {
        setSourceText(e.target.value);
    };

    const handleTargetLangChange = (e) => {
        setTargetLang(e.target.value);
    };


    //
    const handleSpeak = () => {
        if ('speechSynthesis' in window) {
            setIsSpeaking(true);
            const speechSynthesis = window.speechSynthesis;
            const utterance = new SpeechSynthesisUtterance(sourceText);

            const audioData = [];

            utterance.onboundary = (e) => {
                const audioChunk = new Float32Array(e.target.buffer);
                audioData.push(audioChunk);
            };

            utterance.onend = () => {
                setIsSpeaking(false);
                setAudioChunks(audioData);
            };

            speechSynthesis.speak(utterance);
        } else {
            console.log('Speech synthesis not supported.');
        }
    };
    const saveAudio = () => {
        if (audioChunks.length === 0) {
            console.log('No audio available for download.');
            return;
        }

        const mergedAudioChunks = audioChunks.reduce(
            (prev, curr) => new Float32Array([...prev, ...curr]),
            new Float32Array()
        );

        const audioBlob = new Blob([mergedAudioChunks], { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);

        const link = document.createElement('a');
        link.href = audioUrl;
        link.download = 'text-to-speech.wav';
        link.click();
    };
    useEffect(() => {
        setIsDownloadAvailable(audioChunks.length > 0);
    }, [audioChunks]);
    //
    return (
        <div>
            <textarea
                id="sourceText"
                value={sourceText}
                onChange={handleInputChange}
            />
            <select value={targetLang} onChange={handleTargetLangChange}>
                <option value="hi">Hindi</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                {/* Add more language options */}
            </select>
            <button id="button" onClick={handleTranslate}>
                Translate
            </button>
            <textarea id="resultText" value={translatedText} readOnly />


            <div>
                <button onClick={handleSpeak} disabled={isSpeaking}>
                    {isSpeaking ? 'Speaking...' : 'Speak'}
                </button>
                <button onClick={saveAudio} disabled={!isDownloadAvailable}>
                    Download
                </button>
            </div>
        </div>
    );
};

export default TextToSpeech;
