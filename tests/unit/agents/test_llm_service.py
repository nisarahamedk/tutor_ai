import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from agents.llm_service import LLMService

@pytest.fixture
def llm_service():
    return LLMService()

@pytest.mark.asyncio
async def test_generate_assessment_questions_basic():
    """Test basic question generation without LLM integration."""
    service = LLMService()
    questions = await service.generate_assessment_questions("I want to learn Python")
    
    assert isinstance(questions, list)
    assert len(questions) >= 3
    assert all(isinstance(q, str) for q in questions)
    assert all(q.endswith("?") for q in questions)
    assert any("Python" in q for q in questions)

@pytest.mark.asyncio
@patch('agents.llm_service.LiteLLMModel')
@patch('agents.llm_service.CodeAgent')
async def test_generate_assessment_questions_with_ollama(mock_code_agent, mock_litellm):
    """Test question generation with LiteLLMModel integration."""
    # Mock LiteLLMModel and CodeAgent
    mock_litellm_instance = AsyncMock()
    mock_litellm.return_value = mock_litellm_instance
    
    mock_agent_instance = AsyncMock()
    mock_agent_instance.run.return_value = [
        "What is your current level of programming experience?",
        "Have you worked with object-oriented languages before?",
        "What specific Python applications interest you?",
        "Do you have any experience with development tools like Git?"
    ]
    mock_code_agent.return_value = mock_agent_instance
    
    service = LLMService(model_name="llama3.2")
    questions = await service.generate_assessment_questions("I want to learn Python")
    
    # Verify LiteLLMModel and CodeAgent were called correctly
    mock_litellm.assert_called_once_with(
        model_id="llama3.2",
        api_base="http://localhost:11434",
        num_ctx=4096,
        temperature=0.7,
        max_tokens=1000
    )
    mock_code_agent.assert_called_once()
    
    # Verify the task format
    call_args = mock_agent_instance.run.call_args.kwargs
    assert call_args['learning_request'] == "I want to learn Python"
    
    # Verify response
    assert isinstance(questions, list)
    assert len(questions) == 4
    assert "programming experience" in questions[0]
    assert all(q.endswith("?") for q in questions)

@pytest.mark.asyncio
@patch('agents.llm_service.LiteLLMModel')
@patch('agents.llm_service.CodeAgent')
async def test_ollama_error_handling(mock_code_agent, mock_litellm):
    """Test fallback behavior when LiteLLMModel API fails."""
    # Mock LiteLLMModel and CodeAgent to raise an exception
    mock_litellm_instance = AsyncMock()
    mock_litellm.return_value = mock_litellm_instance
    
    mock_agent_instance = AsyncMock()
    mock_agent_instance.run.side_effect = Exception("API Error")
    mock_code_agent.return_value = mock_agent_instance
    
    service = LLMService()
    questions = await service.generate_assessment_questions("I want to learn Python")
    
    # Should fall back to template-based questions
    assert isinstance(questions, list)
    assert len(questions) >= 3
    assert any("Python" in q for q in questions)

@pytest.mark.asyncio
async def test_question_relevance():
    """Test that questions are relevant to the learning request."""
    service = LLMService()
    
    # Test different subjects
    ml_questions = await service.generate_assessment_questions("I want to learn Machine Learning")
    web_questions = await service.generate_assessment_questions("I want to learn Web Development")
    
    # ML questions should mention ML-related terms
    ml_terms = ["machine learning", "ml", "ai", "statistics", "data"]
    assert any(any(term in q.lower() for term in ml_terms) for q in ml_questions)
    
    # Web questions should mention web-related terms
    web_terms = ["web", "frontend", "backend", "html", "javascript"]
    assert any(any(term in q.lower() for term in web_terms) for q in web_questions)

@pytest.mark.asyncio
async def test_question_format():
    """Test the format of generated questions."""
    service = LLMService()
    questions = await service.generate_assessment_questions("I want to learn Python")
    
    for question in questions:
        # Each question should be properly formatted
        assert isinstance(question, str)
        assert len(question.strip()) > 0
        assert question.endswith("?")
        assert not question.startswith("1.") # Should not include numbering
        assert not question.startswith("-") # Should not include bullet points

@pytest.mark.asyncio
@patch('agents.llm_service.LiteLLMModel')
@patch('agents.llm_service.CodeAgent')
async def test_invalid_response_handling(mock_code_agent, mock_litellm):
    """Test handling of invalid responses from the LLM."""
    mock_litellm_instance = AsyncMock()
    mock_litellm.return_value = mock_litellm_instance
    
    mock_agent_instance = AsyncMock()
    mock_agent_instance.run.return_value = "Not a valid Python list"
    mock_code_agent.return_value = mock_agent_instance
    
    service = LLMService()
    questions = await service.generate_assessment_questions("I want to learn Python")
    
    # Should fall back to template-based questions
    assert isinstance(questions, list)
    assert len(questions) >= 3
    assert any("Python" in q for q in questions)