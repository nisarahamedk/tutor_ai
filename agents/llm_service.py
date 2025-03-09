from typing import List, Optional
import logging
from smolagents import Agent, Message, Role
from smolagents.llms import Ollama

class LLMService:
    """Service for interacting with Language Learning Models using smolagents."""
    
    def __init__(self, model_name: str = "mistral"):
        self.logger = logging.getLogger(__name__)
        self.llm = Ollama(model=model_name)
        self.agent = Agent(
            name="TutorAgent",
            system_prompt="""You are an expert tutor who helps assess students' learning needs.
            When generating assessment questions:
            1. Make them specific to the subject
            2. Progress from basic to more specific topics
            3. Focus on understanding background and goals
            4. Each question should be clear and end with a question mark
            5. Do not include numbering or bullet points
            6. Return exactly 4-5 questions""",
            llm=self.llm
        )
    
    def _parse_questions(self, text: str) -> List[str]:
        """Parse questions from the LLM response."""
        questions = []
        for line in text.split("\n"):
            line = line.strip()
            # Remove common prefixes like numbers, dashes, etc.
            line = line.lstrip("0123456789.- *")
            line = line.strip()
            
            # Only include non-empty lines that end with a question mark
            if line and line.endswith("?"):
                questions.append(line)
                
        return questions
        
    async def generate_assessment_questions(self, learning_request: str) -> List[str]:
        """Generate assessment questions based on the learning request.
        
        Args:
            learning_request: The user's learning request (e.g., "I want to learn Python")
            
        Returns:
            List of relevant assessment questions
            
        Raises:
            Exception: If there's an error communicating with the LLM service
        """
        try:
            prompt = f"""A student has said: "{learning_request}"
            Generate 4-5 relevant assessment questions to understand their current knowledge level, 
            learning goals, and specific interests in this subject.
            
            Return only the questions, one per line."""
            
            # Get response from the agent
            response = await self.agent.chat(
                messages=[Message(role=Role.USER, content=prompt)]
            )
            
            # Parse questions from response
            questions = self._parse_questions(response.content)
            
            # Validate we got enough questions
            if len(questions) < 3:
                self.logger.warning("LLM returned too few questions, falling back to templates")
                return self._get_template_questions(learning_request)
                
            return questions
            
        except Exception as e:
            self.logger.error(f"Failed to generate questions using LLM: {e}")
            return self._get_template_questions(learning_request)
            
    def _get_template_questions(self, learning_request: str) -> List[str]:
        """Fallback method to generate template-based questions."""
        self.logger.info("Using template-based questions")
        subject = learning_request.lower()
        
        if "python" in subject:
            return [
                "What is your current level of programming experience?",
                "Have you used any programming languages before Python?",
                "What specific Python applications interest you (web, data science, automation)?",
                "Do you have any specific Python libraries or frameworks in mind?"
            ]
        elif "machine learning" in subject or "ml" in subject:
            return [
                "What is your background in AI and statistics?",
                "Have you worked with any ML frameworks before?",
                "What specific ML applications interest you?",
                "Are you familiar with Python, as it's commonly used in ML?"
            ]
        elif "web" in subject:
            return [
                "Are you more interested in frontend or backend development?",
                "Have you worked with HTML, CSS, or JavaScript before?",
                "Which web frameworks are you interested in learning?",
                "Do you have experience with any web technologies?"
            ]
        else:
            return [
                f"What is your current knowledge level in {learning_request}?",
                "What specific aspects of this subject interest you most?",
                "How do you plan to apply this knowledge?",
                "What learning resources have you tried before?"
            ]