from typing import List, Optional, Dict
import logging
import os
from smolagents import CodeAgent
from smolagents import LiteLLMModel

class LLMService:
    """Service for interacting with Language Learning Models using smolagents."""
    
    def __init__(self, model_name: str = "gpt-3.5-turbo"):
        self.logger = logging.getLogger(__name__)
        
        # Get OpenAI API key from environment variable
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable must be set")
            
        self.llm = LiteLLMModel(
            model_id=model_name,
            api_key=api_key,
            temperature=0.7,
            max_tokens=1000  # Reasonable limit for our use case
        )
        
        # Define prompt templates for the agent
        prompt_templates = {
            "system_prompt": f"""You are an expert tutor who helps assess students' learning needs.
When generating assessment questions:
1. Make them specific to the subject
2. Progress from basic to more specific topics
3. Focus on understanding background and goals
4. Each question should be clear and end with a question mark
5. Do not include numbering or bullet points
6. Return exactly 4-5 questions

Generate 4-5 relevant assessment questions to understand their current knowledge level, 
learning goals, and specific interests in this subject.

You will write Python code that returns the questions. Example:
```python
questions = [
    "What is your current level of experience in this subject?",
    "Have you studied any related topics before?",
    "What specific aspects interest you most?",
    "What are your goals for learning this subject?"
]
final_answer(questions)
```"""
        }
        
        self.agent = CodeAgent(
            name="TutorAgent",
            model=self.llm,
            tools=[],  # No additional tools needed for question generation
            add_base_tools=False,  # We don't need any base tools for question generation
            prompt_templates=prompt_templates
        )
    

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
            # Get response from the agent
            result = await self.agent.run(learning_request=learning_request)
            
            # Validate we got enough questions
            if isinstance(result, list) and len(result) >= 3:
                return result
                
            self.logger.warning("LLM returned invalid response or too few questions, falling back to templates")
            return self._get_template_questions(learning_request)
            
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