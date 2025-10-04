// Free AI API integration for better suggestions
// Using Hugging Face Inference API (free tier)

export class FreeAIService {
  private static readonly API_URL = 'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium';
  private static readonly API_KEY = 'hf_your_free_api_key_here'; // Replace with actual free API key

  static async generateCodeSuggestion(code: string, error: string): Promise<string> {
    try {
      // For now, we'll use a local AI simulation
      // In production, you would integrate with a free AI service like:
      // - Hugging Face Inference API (free tier)
      // - OpenAI API (with free credits)
      // - Cohere API (free tier)
      // - Local AI models

      return this.simulateAISuggestion(code, error);
    } catch (error) {
      console.warn('AI service unavailable, using fallback:', error);
      return this.simulateAISuggestion(code, error);
    }
  }

  private static simulateAISuggestion(code: string, error: string): string {
    // Enhanced simulation based on error patterns
    if (error.includes('Expected `;`')) {
      return 'Add semicolon at the end of the statement';
    } else if (error.includes('pinMode')) {
      return 'pinMode function requires two parameters: pin number and mode (INPUT/OUTPUT)';
    } else if (error.includes('digitalWrite')) {
      return 'digitalWrite function requires pin number and value (HIGH/LOW)';
    } else if (error.includes('variable declaration')) {
      return 'Declare variable with proper data type (int, float, bool, etc.)';
    } else if (error.includes('void setup')) {
      return 'Arduino sketches must have a setup() function for initialization';
    } else if (error.includes('void loop')) {
      return 'Arduino sketches must have a loop() function for main program execution';
    } else if (error.includes('unclosed brace')) {
      return 'Add missing closing brace } to complete the code block';
    } else {
      return 'Check Arduino syntax and ensure proper function calls';
    }
  }

  static async generateCodeCompletion(partialCode: string): Promise<string[]> {
    // Simulate code completion suggestions
    const suggestions: string[] = [];
    
    if (partialCode.includes('pin')) {
      suggestions.push('pinMode(pin, OUTPUT);');
      suggestions.push('digitalWrite(pin, HIGH);');
      suggestions.push('digitalRead(pin);');
    }
    
    if (partialCode.includes('Serial')) {
      suggestions.push('Serial.begin(9600);');
      suggestions.push('Serial.println("Hello");');
      suggestions.push('Serial.print(value);');
    }
    
    if (partialCode.includes('analog')) {
      suggestions.push('analogWrite(pin, value);');
      suggestions.push('analogRead(pin);');
    }
    
    if (partialCode.includes('delay')) {
      suggestions.push('delay(1000);');
    }
    
    return suggestions;
  }

  static async explainCode(code: string): Promise<string> {
    // Simulate code explanation
    let explanation = 'This Arduino code ';
    
    if (code.includes('pinMode')) {
      explanation += 'configures pins for input/output operations. ';
    }
    
    if (code.includes('digitalWrite')) {
      explanation += 'Controls digital outputs (LEDs, relays, etc.). ';
    }
    
    if (code.includes('analogRead')) {
      explanation += 'reads analog sensor values. ';
    }
    
    if (code.includes('Serial')) {
      explanation += 'uses serial communication for debugging. ';
    }
    
    explanation += 'Make sure to connect components to the correct pins.';
    
    return explanation;
  }

  // Method to integrate with actual free AI APIs
  static async callHuggingFaceAPI(prompt: string): Promise<string> {
    try {
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_length: 100,
            temperature: 0.7,
          }
        })
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      return data[0]?.generated_text || 'No response from AI';
    } catch (error) {
      console.warn('Hugging Face API error:', error);
      return this.simulateAISuggestion('', prompt);
    }
  }

  // Method to integrate with OpenAI API (free tier)
  static async callOpenAIAPI(prompt: string): Promise<string> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer your_openai_api_key',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are an Arduino programming expert. Provide concise, helpful suggestions for Arduino code.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 150,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error('OpenAI API request failed');
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || 'No response from AI';
    } catch (error) {
      console.warn('OpenAI API error:', error);
      return this.simulateAISuggestion('', prompt);
    }
  }
}
