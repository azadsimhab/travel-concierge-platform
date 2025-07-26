"""
Voice Integration System for Personalized Travel AI
Supports speech-to-text, text-to-speech, and voice personality adaptation
"""

import io
import base64
import asyncio
import logging
from typing import Dict, Any, Optional, BinaryIO, List
from enum import Enum
import json
from datetime import datetime

# For speech recognition and synthesis
try:
    import speech_recognition as sr
    import pyttsx3
    import pygame
    BASIC_VOICE_AVAILABLE = True
except ImportError:
    BASIC_VOICE_AVAILABLE = False
    sr = None
    pyttsx3 = None
    pygame = None

try:
    from google.cloud import texttospeech
    from google.cloud import speech as google_speech
    GOOGLE_VOICE_AVAILABLE = True
except ImportError:
    GOOGLE_VOICE_AVAILABLE = False
    texttospeech = None
    google_speech = None

VOICE_AVAILABLE = BASIC_VOICE_AVAILABLE or GOOGLE_VOICE_AVAILABLE

if not VOICE_AVAILABLE:
    logging.warning("Voice dependencies not installed. Install with: pip install SpeechRecognition pyttsx3 pygame")

logger = logging.getLogger(__name__)

class VoicePersonality(Enum):
    PROFESSIONAL = "professional"
    FRIENDLY = "friendly"
    ENTHUSIASTIC = "enthusiastic"
    CALM = "calm"
    ENERGETIC = "energetic"

class VoiceGender(Enum):
    MALE = "male"
    FEMALE = "female"
    NEUTRAL = "neutral"

class VoiceLanguage(Enum):
    ENGLISH_US = "en-US"
    ENGLISH_UK = "en-GB"
    HINDI = "hi-IN"
    SPANISH = "es-ES"
    FRENCH = "fr-FR"
    GERMAN = "de-DE"

class VoiceSystem:
    def __init__(self, google_cloud_credentials: Optional[str] = None):
        """Initialize voice system with optional Google Cloud credentials"""
        self.google_credentials = google_cloud_credentials
        self.local_tts_engine = None
        self.speech_recognizer = None
        
        if VOICE_AVAILABLE:
            self._initialize_local_systems()
            if google_cloud_credentials:
                self._initialize_google_cloud()
        else:
            logger.warning("Voice system not available - missing dependencies")
    
    def _initialize_local_systems(self):
        """Initialize local speech recognition and TTS"""
        if not BASIC_VOICE_AVAILABLE:
            logger.warning("Basic voice dependencies not available")
            return
            
        try:
            # Initialize speech recognition
            if sr:
                self.speech_recognizer = sr.Recognizer()
            
            # Initialize local TTS engine
            if pyttsx3:
                self.local_tts_engine = pyttsx3.init()
                
                # Configure TTS settings
                voices = self.local_tts_engine.getProperty('voices')
                if voices:
                    self.local_tts_engine.setProperty('voice', voices[0].id)
                
                self.local_tts_engine.setProperty('rate', 180)  # Speed
                self.local_tts_engine.setProperty('volume', 0.8)  # Volume
            
            logger.info("Local voice systems initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize local voice systems: {e}")
    
    def _initialize_google_cloud(self):
        """Initialize Google Cloud Speech services"""
        if not GOOGLE_VOICE_AVAILABLE:
            logger.warning("Google Cloud voice dependencies not available")
            return
            
        try:
            # Set up Google Cloud credentials
            import os
            os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = self.google_credentials
            
            # Initialize clients
            if texttospeech:
                self.tts_client = texttospeech.TextToSpeechClient()
            if google_speech:
                self.speech_client = google_speech.SpeechClient()
            
            logger.info("Google Cloud voice services initialized")
        except Exception as e:
            logger.error(f"Failed to initialize Google Cloud services: {e}")
            self.tts_client = None
            self.speech_client = None
    
    async def speech_to_text(
        self, 
        audio_data: bytes, 
        language: VoiceLanguage = VoiceLanguage.ENGLISH_US,
        use_google_cloud: bool = True
    ) -> Dict[str, Any]:
        """Convert speech audio to text"""
        
        if not VOICE_AVAILABLE:
            return {"error": "Voice system not available", "text": ""}
        
        try:
            if use_google_cloud and self.speech_client:
                return await self._google_speech_to_text(audio_data, language)
            else:
                return await self._local_speech_to_text(audio_data, language)
        except Exception as e:
            logger.error(f"Speech to text error: {e}")
            return {"error": str(e), "text": ""}
    
    async def _google_speech_to_text(self, audio_data: bytes, language: VoiceLanguage) -> Dict[str, Any]:
        """Use Google Cloud Speech-to-Text"""
        if not google_speech:
            return {"error": "Google Cloud Speech not available", "text": ""}
            
        try:
            audio = google_speech.RecognitionAudio(content=audio_data)
            config = google_speech.RecognitionConfig(
                encoding=google_speech.RecognitionConfig.AudioEncoding.WEBM_OPUS,
                sample_rate_hertz=48000,
                language_code=language.value,
                enable_automatic_punctuation=True,
                enable_spoken_punctuation=True,
                enable_spoken_emojis=True,
                model="latest_long"
            )
            
            response = await asyncio.to_thread(
                self.speech_client.recognize,
                config=config,
                audio=audio
            )
            
            if response.results:
                transcript = response.results[0].alternatives[0].transcript
                confidence = response.results[0].alternatives[0].confidence
                
                return {
                    "text": transcript,
                    "confidence": confidence,
                    "language": language.value,
                    "service": "google_cloud"
                }
            else:
                return {"error": "No speech detected", "text": ""}
                
        except Exception as e:
            logger.error(f"Google Speech-to-Text error: {e}")
            return {"error": str(e), "text": ""}
    
    async def _local_speech_to_text(self, audio_data: bytes, language: VoiceLanguage) -> Dict[str, Any]:
        """Use local speech recognition"""
        try:
            # Convert audio data to audio source
            audio_source = sr.AudioData(audio_data, 44100, 2)
            
            # Use Google's free speech recognition
            text = await asyncio.to_thread(
                self.speech_recognizer.recognize_google,
                audio_source,
                language=language.value
            )
            
            return {
                "text": text,
                "confidence": 0.85,  # Estimated
                "language": language.value,
                "service": "local_google"
            }
            
        except sr.UnknownValueError:
            return {"error": "Could not understand audio", "text": ""}
        except sr.RequestError as e:
            return {"error": f"Speech recognition error: {e}", "text": ""}
    
    async def text_to_speech(
        self,
        text: str,
        voice_personality: VoicePersonality = VoicePersonality.FRIENDLY,
        voice_gender: VoiceGender = VoiceGender.FEMALE,
        language: VoiceLanguage = VoiceLanguage.ENGLISH_US,
        use_google_cloud: bool = True
    ) -> Dict[str, Any]:
        """Convert text to speech with personality"""
        
        if not VOICE_AVAILABLE:
            return {"error": "Voice system not available", "audio_data": None}
        
        try:
            if use_google_cloud and self.tts_client:
                return await self._google_text_to_speech(text, voice_personality, voice_gender, language)
            else:
                return await self._local_text_to_speech(text, voice_personality)
        except Exception as e:
            logger.error(f"Text to speech error: {e}")
            return {"error": str(e), "audio_data": None}
    
    async def _google_text_to_speech(
        self, 
        text: str, 
        voice_personality: VoicePersonality,
        voice_gender: VoiceGender,
        language: VoiceLanguage
    ) -> Dict[str, Any]:
        """Use Google Cloud Text-to-Speech with personality"""
        try:
            # Adjust text based on personality
            adjusted_text = self._adjust_text_for_personality(text, voice_personality)
            
            # Configure voice based on personality and gender
            voice_config = self._get_google_voice_config(voice_personality, voice_gender, language)
            
            if not texttospeech:
                return {"error": "Google Cloud TTS not available", "audio_data": None}
                
            synthesis_input = texttospeech.SynthesisInput(text=adjusted_text)
            
            # Configure audio
            audio_config = texttospeech.AudioConfig(
                audio_encoding=texttospeech.AudioEncoding.MP3,
                speaking_rate=self._get_speaking_rate(voice_personality),
                pitch=self._get_pitch(voice_personality),
                volume_gain_db=0.0
            )
            
            response = await asyncio.to_thread(
                self.tts_client.synthesize_speech,
                input=synthesis_input,
                voice=voice_config,
                audio_config=audio_config
            )
            
            # Encode audio as base64 for web transmission
            audio_base64 = base64.b64encode(response.audio_content).decode('utf-8')
            
            return {
                "audio_data": audio_base64,
                "audio_format": "mp3",
                "duration_estimate": len(text) * 0.05,  # Rough estimate
                "voice_personality": voice_personality.value,
                "service": "google_cloud"
            }
            
        except Exception as e:
            logger.error(f"Google Text-to-Speech error: {e}")
            return {"error": str(e), "audio_data": None}
    
    async def _local_text_to_speech(self, text: str, voice_personality: VoicePersonality) -> Dict[str, Any]:
        """Use local TTS engine"""
        try:
            # Adjust text for personality
            adjusted_text = self._adjust_text_for_personality(text, voice_personality)
            
            # Configure engine based on personality
            self._configure_local_tts_personality(voice_personality)
            
            # Generate speech to temporary file
            import tempfile
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp_file:
                self.local_tts_engine.save_to_file(adjusted_text, tmp_file.name)
                self.local_tts_engine.runAndWait()
                
                # Read the file and encode as base64
                with open(tmp_file.name, 'rb') as audio_file:
                    audio_data = audio_file.read()
                    audio_base64 = base64.b64encode(audio_data).decode('utf-8')
                
                import os
                os.unlink(tmp_file.name)  # Clean up
                
                return {
                    "audio_data": audio_base64,
                    "audio_format": "wav",
                    "duration_estimate": len(text) * 0.06,
                    "voice_personality": voice_personality.value,
                    "service": "local"
                }
                
        except Exception as e:
            logger.error(f"Local TTS error: {e}")
            return {"error": str(e), "audio_data": None}
    
    def _adjust_text_for_personality(self, text: str, personality: VoicePersonality) -> str:
        """Adjust text content based on voice personality"""
        
        if personality == VoicePersonality.ENTHUSIASTIC:
            # Add more exclamation marks and enthusiastic words
            text = text.replace(".", "!")
            text = text.replace("great", "absolutely amazing")
            text = text.replace("good", "fantastic")
            text = "Oh wow! " + text if not text.startswith(("Oh", "Wow", "Amazing")) else text
            
        elif personality == VoicePersonality.PROFESSIONAL:
            # More formal language
            text = text.replace("awesome", "excellent")
            text = text.replace("cool", "impressive")
            text = text.replace("Hey", "Hello")
            
        elif personality == VoicePersonality.CALM:
            # Slower, more peaceful language
            text = text.replace("!", ".")
            text = text.replace("quickly", "at a comfortable pace")
            text = "Let me calmly guide you... " + text if not text.startswith("Let") else text
            
        elif personality == VoicePersonality.ENERGETIC:
            # Fast-paced, energetic language
            text = text.replace(".", "!")
            text = "Let's dive right in! " + text if not text.startswith("Let's") else text
            
        return text
    
    def _get_google_voice_config(
        self, 
        personality: VoicePersonality, 
        gender: VoiceGender, 
        language: VoiceLanguage
    ):
        """Get Google Cloud voice configuration"""
        
        # Map personalities to Google voice names
        voice_mapping = {
            (VoiceLanguage.ENGLISH_US, VoiceGender.FEMALE): {
                VoicePersonality.FRIENDLY: "en-US-Journey-F",
                VoicePersonality.PROFESSIONAL: "en-US-Studio-O",
                VoicePersonality.ENTHUSIASTIC: "en-US-Journey-F",
                VoicePersonality.CALM: "en-US-Studio-M",
                VoicePersonality.ENERGETIC: "en-US-Journey-F"
            },
            (VoiceLanguage.ENGLISH_US, VoiceGender.MALE): {
                VoicePersonality.FRIENDLY: "en-US-Journey-D",
                VoicePersonality.PROFESSIONAL: "en-US-Studio-M",
                VoicePersonality.ENTHUSIASTIC: "en-US-Journey-D",
                VoicePersonality.CALM: "en-US-Studio-M",
                VoicePersonality.ENERGETIC: "en-US-Journey-D"
            }
        }
        
        voice_name = voice_mapping.get((language, gender), {}).get(
            personality, 
            "en-US-Journey-F"  # Default
        )
        
        if texttospeech:
            return texttospeech.VoiceSelectionParams(
                language_code=language.value,
                name=voice_name
            )
        else:
            return {
                "language_code": language.value,
                "name": voice_name
            }
    
    def _get_speaking_rate(self, personality: VoicePersonality) -> float:
        """Get speaking rate based on personality"""
        rates = {
            VoicePersonality.CALM: 0.8,
            VoicePersonality.PROFESSIONAL: 0.9,
            VoicePersonality.FRIENDLY: 1.0,
            VoicePersonality.ENTHUSIASTIC: 1.1,
            VoicePersonality.ENERGETIC: 1.2
        }
        return rates.get(personality, 1.0)
    
    def _get_pitch(self, personality: VoicePersonality) -> float:
        """Get pitch based on personality"""
        pitches = {
            VoicePersonality.CALM: -2.0,
            VoicePersonality.PROFESSIONAL: 0.0,
            VoicePersonality.FRIENDLY: 1.0,
            VoicePersonality.ENTHUSIASTIC: 3.0,
            VoicePersonality.ENERGETIC: 2.0
        }
        return pitches.get(personality, 0.0)
    
    def _configure_local_tts_personality(self, personality: VoicePersonality):
        """Configure local TTS engine for personality"""
        if not self.local_tts_engine:
            return
        
        # Adjust rate and volume based on personality
        if personality == VoicePersonality.CALM:
            self.local_tts_engine.setProperty('rate', 150)
            self.local_tts_engine.setProperty('volume', 0.7)
        elif personality == VoicePersonality.ENERGETIC:
            self.local_tts_engine.setProperty('rate', 200)
            self.local_tts_engine.setProperty('volume', 0.9)
        elif personality == VoicePersonality.PROFESSIONAL:
            self.local_tts_engine.setProperty('rate', 170)
            self.local_tts_engine.setProperty('volume', 0.8)
        else:  # Default friendly
            self.local_tts_engine.setProperty('rate', 180)
            self.local_tts_engine.setProperty('volume', 0.8)
    
    def get_supported_languages(self) -> List[Dict[str, str]]:
        """Get list of supported languages"""
        return [
            {"code": "en-US", "name": "English (US)", "available": True},
            {"code": "en-GB", "name": "English (UK)", "available": True},
            {"code": "hi-IN", "name": "Hindi (India)", "available": True},
            {"code": "es-ES", "name": "Spanish", "available": True},
            {"code": "fr-FR", "name": "French", "available": True},
            {"code": "de-DE", "name": "German", "available": True}
        ]
    
    def get_voice_personalities(self) -> List[Dict[str, str]]:
        """Get available voice personalities"""
        return [
            {"id": "friendly", "name": "Friendly", "description": "Warm and approachable"},
            {"id": "professional", "name": "Professional", "description": "Business-like and efficient"},
            {"id": "enthusiastic", "name": "Enthusiastic", "description": "Energetic and exciting"},
            {"id": "calm", "name": "Calm", "description": "Peaceful and relaxing"},
            {"id": "energetic", "name": "Energetic", "description": "Fast-paced and dynamic"}
        ]
    
    async def analyze_voice_input(self, audio_data: bytes) -> Dict[str, Any]:
        """Analyze voice input for emotional tone and intent"""
        try:
            # Convert speech to text first
            stt_result = await self.speech_to_text(audio_data)
            
            if stt_result.get("error"):
                return stt_result
            
            text = stt_result["text"]
            
            # Simple emotion analysis based on text and tone
            emotion_analysis = self._analyze_emotion_from_text(text)
            
            return {
                "text": text,
                "confidence": stt_result.get("confidence", 0.8),
                "emotion": emotion_analysis,
                "suggested_personality": self._suggest_voice_personality(emotion_analysis),
                "language": stt_result.get("language", "en-US")
            }
            
        except Exception as e:
            logger.error(f"Voice analysis error: {e}")
            return {"error": str(e), "text": ""}
    
    def _analyze_emotion_from_text(self, text: str) -> Dict[str, float]:
        """Simple emotion analysis from text"""
        text_lower = text.lower()
        
        emotions = {
            "excited": 0.0,
            "calm": 0.0,
            "happy": 0.0,
            "professional": 0.0,
            "curious": 0.0
        }
        
        # Excited indicators
        if any(word in text_lower for word in ["wow", "amazing", "awesome", "incredible", "fantastic"]):
            emotions["excited"] += 0.3
        if "!" in text:
            emotions["excited"] += 0.2
        
        # Calm indicators
        if any(word in text_lower for word in ["relax", "peaceful", "calm", "quiet", "serene"]):
            emotions["calm"] += 0.4
        
        # Happy indicators
        if any(word in text_lower for word in ["happy", "joy", "great", "wonderful", "lovely"]):
            emotions["happy"] += 0.3
        
        # Professional indicators
        if any(word in text_lower for word in ["business", "meeting", "work", "professional", "formal"]):
            emotions["professional"] += 0.4
        
        # Curious indicators
        if any(word in text_lower for word in ["what", "how", "why", "where", "when"]):
            emotions["curious"] += 0.2
        
        return emotions
    
    def _suggest_voice_personality(self, emotions: Dict[str, float]) -> VoicePersonality:
        """Suggest voice personality based on detected emotions"""
        max_emotion = max(emotions.items(), key=lambda x: x[1])
        
        emotion_to_personality = {
            "excited": VoicePersonality.ENTHUSIASTIC,
            "calm": VoicePersonality.CALM,
            "happy": VoicePersonality.FRIENDLY,
            "professional": VoicePersonality.PROFESSIONAL,
            "curious": VoicePersonality.FRIENDLY
        }
        
        return emotion_to_personality.get(max_emotion[0], VoicePersonality.FRIENDLY)

# Global voice system instance
voice_system = None

def initialize_voice_system(google_cloud_credentials: Optional[str] = None):
    """Initialize the global voice system"""
    global voice_system
    voice_system = VoiceSystem(google_cloud_credentials)
    return voice_system

def get_voice_system() -> Optional[VoiceSystem]:
    """Get the global voice system instance"""
    return voice_system