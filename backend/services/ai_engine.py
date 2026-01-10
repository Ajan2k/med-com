import json
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from backend.config import settings

class AIEngine:
    def __init__(self):
        # Initialize Groq with Llama-3 (Fast & Good for Medical)
        if settings.GROQ_API_KEY:
            self.llm = ChatGroq(
                temperature=0.3, 
                model_name="llama-3.3-70b-versatile", 
                groq_api_key=settings.GROQ_API_KEY
            )
        else:
            self.llm = None
            print("⚠️ WARNING: Groq API Key missing. AI features will not work.")

    def analyze_symptoms(self, user_query: str):
        """
        Analyzes user input to determine urgency and suggested department.
        Returns JSON: { "danger_level": "High/Medium/Low", "department": "Cardiology", "advice": "..." }
        """
        if not self.llm:
            return {"error": "AI Service Unavailable"}

        system_prompt = """
        You are a medical triage assistant. Analyze the user's symptoms.
        Return a strict JSON response with these keys:
        - "danger_level": "High", "Medium", or "Low"
        - "department": The relevant medical department (e.g., Cardiology, Neurology, General)
        - "advice": A short, empathetic response.
        
        CRITICAL: If symptoms are severe (chest pain, breathing trouble), set danger_level to "High".
        Do NOT provide a diagnosis. Only triage.
        """
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("human", "{query}")
        ])
        
        chain = prompt | self.llm
        try:
            response = chain.invoke({"query": user_query})
            # Clean up response to ensure valid JSON
            content = response.content.strip()
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            return json.loads(content)
        except Exception as e:
            print(f"AI Error: {e}")
            return {"danger_level": "Low", "department": "General", "advice": "I couldn't analyze that properly. Please consult a doctor."}

    def chat_response(self, user_query: str, history: list):
        """
        Handles general health Q&A with context.
        """
        if not self.llm:
            return "AI Service is offline."

        messages = [
            SystemMessage(content="You are a helpful healthcare chatbot. Answer general health questions. If the user asks for appointments, guide them to the booking menu.")
        ]
        
        # Add past 3 messages for context
        for msg in history[-3:]:
            if msg['role'] == 'user':
                messages.append(HumanMessage(content=msg['content']))
            else:
                messages.append(AIMessage(content=msg['content']))
        
        messages.append(HumanMessage(content=user_query))
        
        response = self.llm.invoke(messages)
        return response.content

# Singleton Instance
ai_service = AIEngine()