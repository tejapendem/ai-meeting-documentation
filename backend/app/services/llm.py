from openai import OpenAI
import os

def call_llm(prompt: str) -> str:
    client = OpenAI()  # reads OPENAI_API_KEY automatically

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": "You convert meeting transcripts into clear, structured documentation with headings, bullet points, action items, and summaries."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.3,
    )

    return response.choices[0].message.content
