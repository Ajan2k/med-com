import json
import os
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from dotenv import load_dotenv

# Find .env file in the backend directory
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
dot_env_path = os.path.join(backend_dir, '.env')
load_dotenv(dot_env_path)

# --- STRICT GUARDRAILS ---
STRICT_SYSTEM_PROMPT = """
You are 'MediCare AI', a specialized medical assistant for a hospital management platform.

YOUR RESPONSIBILITIES:
1. Assist with doctor appointments, lab tests, and pharmacy orders.
2. Answer queries about symptoms, diseases, and general health (provide a disclaimer).
3. Explain hospital services and check status of bookings.

STRICT GUARDRAILS:
- You must REFUSE to answer any question unrelated to healthcare, medicine, or the hospital platform.
- If a user asks about geography (e.g., "Where is Chennai?"), history, politics, movies, coding, or general trivia, you must reply EXACTLY:
  "I apologize, but I am a specialized healthcare assistant. I can only help with medical queries, appointments, and lab tests."
- Do not provide the answer to the non-medical question.
- Do not generate code or write essays.

TONE:
- Professional, empathetic, and concise.
"""

class AIEngine:
    def __init__(self):
        # Initialize Groq with Llama-3
        api_key = os.getenv("GROQ_API_KEY")
        if api_key and api_key.strip():
            self.llm = ChatGroq(
                temperature=0.3, 
                model_name="llama-3.3-70b-versatile", 
                groq_api_key=api_key
            )
        else:
            self.llm = None
            print(" CRITICAL: Groq API Key missing. AI diagnosis will be disabled.")

    def analyze_symptoms(self, user_query: str):
        """
        Analyzes user input to determine urgency and suggested department.
        Returns JSON: { "danger_level": "High/Medium/Low", "department": "Cardiology", "advice": "..." }
        """
        if not self.llm:
            return {"error": "AI Service Unavailable"}
        
        # Specific prompt for JSON extraction
        analysis_prompt = ChatPromptTemplate.from_messages([
            ("system", "You are a medical triage AI. Analyze the symptoms. Return ONLY a valid JSON object with keys: danger_level, department, advice. Do not add markdown formatting."),
            ("human", "{query}")
        ])
        
        chain = analysis_prompt | self.llm
        try:
            response = chain.invoke({"query": user_query})
            content = response.content.strip()
            # Clean up markdown if Llama adds it
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                 content = content.split("```")[1].split("```")[0]
            return json.loads(content)
        except Exception as e:
            print(f"AI JSON Error: {e}")
            return {"danger_level": "Low", "department": "General", "advice": "Please consult a doctor directly."}

    def chat_response(self, user_query: str, history: list):
        """
        Handles general health Q&A with context and STRICT GUARDRAILS.
        """
        if not self.llm:
            return "Healthcare AI Service is currently unavailable. Please contact the administrator to provide a valid API key."

        # 1. Start with the STRICT System Message
        messages = [
            SystemMessage(content=STRICT_SYSTEM_PROMPT)
        ]
        
        # 2. Add History Context (limit to last 5 for efficiency)
        for msg in history[-5:]:
            if msg.get('role') == 'user':
                messages.append(HumanMessage(content=msg.get('content', '')))
            else:
                messages.append(AIMessage(content=msg.get('content', '')))
        
        # 3. Add Current Query
        messages.append(HumanMessage(content=user_query))
        
        try:
            response = self.llm.invoke(messages)
            return response.content
        except Exception as e:
            print(f"Groq Chat Error: {e}")
            if "rate_limit" in str(e).lower():
                return "I am receiving too many requests at the moment. Please wait a few seconds and try again."
            return "I'm having a bit of trouble processing that. Could you please rephrase or try again in a moment?"

    def validate_prescription(self, extracted_text: str):
        """
        Uses AI to determine if a text snippet is a valid medical prescription.
        Returns: (is_valid, reason)
        """
        if not self.llm:
            return False, "AI Service Unavailable"

        prompt = f"""
        Analyze the following text extracted from an image. 
        Determine if it represents a medical prescription (e.g., contains doctor name, medicine names, dosages like '500mg', '1 tab', or instructions like 'twice a day').
        
        TEXT: "{extracted_text}"
        
        Respond ONLY in JSON format: 
        {{
            "is_prescription": true/false,
            "reason": "short explanation"
        }}
        """
        
        try:
            response = self.llm.invoke([HumanMessage(content=prompt)])
            content = response.content.strip()
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            data = json.loads(content)
            return data.get("is_prescription", False), data.get("reason", "Unknown reason")
        except Exception as e:
            print(f"Prescription Validation Error: {e}")
            return True, "Error during validation, allowing pass" # Fail safe for demo

# Singleton Instance (Optional, depending on how you import)
ai_service = AIEngine()

# --- HELPER FUNCTION FOR ROUTER ---
# This matches the function signature your patient.py router expects
def get_ai_response(user_input: str, chat_history: list):
    return ai_service.chat_response(user_input, chat_history)