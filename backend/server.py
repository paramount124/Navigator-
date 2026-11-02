import os
import json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
from google import genai
from google.genai import types
from dotenv import load_dotenv
load_dotenv()

client = genai.Client()
app = FastAPI()

app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"],
)

class GuideRequest(BaseModel):
    url: str
    goal: str
    elements: List[Dict[str, Any]]

class Step(BaseModel):
    order: int
    selector: str
    instruction: str

# Updated Schema: Added is_complete flag
class GuideResponse(BaseModel):
    is_complete: bool
    steps: List[Step]

@app.post("/get-steps")
def get_steps(request: GuideRequest):
    elements_text = "\n".join(
        [f"- Text: '{el['text']}' | Type: {el['type']} | Selector: {el['selector']}" 
         for el in request.elements[:150]]
    )
    
    prompt = f"""
    The user's goal is: "{request.goal}".
    They are currently on: {request.url}.
    
    Available interactive elements on this specific page:
    {elements_text}
    
    Tasks:
    1. If the user's goal is already achieved by simply being on this page (e.g., they wanted to view their profile and this is the profile page), set 'is_complete' to true and return empty steps.
    2. Otherwise, determine the sequence of clicks on THIS PAGE ONLY to get them closer to their goal. Set 'is_complete' to false.
    """

    response = client.models.generate_content(
        model='gemini-3.5-flash',
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=GuideResponse,
            temperature=0.1, 
        ),
    )
    
    return json.loads(response.text)