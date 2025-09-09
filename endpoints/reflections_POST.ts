import { db } from "../helpers/db";
import { schema, InputType, OutputType } from "./reflections_POST.schema";
import superjson from 'superjson';
import { Transaction } from "kysely";
import { DB } from "../helpers/schema";
import { getServerUserSession } from "../helpers/getServerUserSession";

// Try the working star ratings model first
const HUGGINGFACE_API_URL = "https://api-inference.huggingface.co/models/nlptown/bert-base-multilingual-uncased-sentiment";
// Backup models to try if the primary fails - all are sentiment analysis models
const BACKUP_MODELS = [
  "SamLowe/roberta-base-go_emotions",
  "cardiffnlp/twitter-roberta-base-sentiment-latest",
  "distilbert-base-uncased-finetuned-sst-2-english"
];

// Simple rule-based sentiment analysis as final fallback
function ruleBasedSentiment(text: string): string {
  const lowerText = text.toLowerCase();
  
  // Positive keywords
  const positiveWords = [
    'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'awesome', 
    'love', 'enjoy', 'happy', 'pleased', 'satisfied', 'proud', 'accomplished',
    'successful', 'easy', 'fun', 'exciting', 'perfect', 'brilliant', 'outstanding'
  ];
  
  // Negative keywords
  const negativeWords = [
    'bad', 'terrible', 'awful', 'horrible', 'hate', 'dislike', 'frustrated',
    'angry', 'disappointed', 'difficult', 'hard', 'impossible', 'failed',
    'struggled', 'stressed', 'worried', 'confused', 'overwhelmed', 'upset'
  ];
  
  let positiveCount = 0;
  let negativeCount = 0;
  
  positiveWords.forEach(word => {
    if (lowerText.includes(word)) positiveCount++;
  });
  
  negativeWords.forEach(word => {
    if (lowerText.includes(word)) negativeCount++;
  });
  
  if (positiveCount > negativeCount) {
    return 'POSITIVE';
  } else if (negativeCount > positiveCount) {
    return 'NEGATIVE';
  } else {
    return 'NEUTRAL';
  }
}

async function analyzeSentiment(text: string): Promise<string> {
  const apiToken = process.env.HUGGINGFACE_API_TOKEN;
  
  // Enhanced API token validation
  if (!apiToken) {
    console.error("HUGGINGFACE_API_TOKEN is not set in environment variables.");
    console.log("Falling back to rule-based sentiment analysis");
    return ruleBasedSentiment(text);
  }
  
  // Validate token format (HF tokens typically start with "hf_")
  if (!apiToken.startsWith('hf_')) {
    console.warn("HUGGINGFACE_API_TOKEN does not start with 'hf_' - this might indicate an invalid token format.");
  }
  
  console.log(`API token exists: ${apiToken ? 'YES' : 'NO'}`);
  console.log(`API token length: ${apiToken.length}`);
  console.log(`API token prefix: ${apiToken.substring(0, 8)}...`);

  // Try primary model first, then backup models
  const modelsToTry = [HUGGINGFACE_API_URL, ...BACKUP_MODELS.map(model => `https://api-inference.huggingface.co/models/${model}`)];
  
  for (let i = 0; i < modelsToTry.length; i++) {
    const modelUrl = modelsToTry[i];
    const modelName = modelUrl.split('/models/')[1];
    
    try {
      console.log(`\n--- Attempt ${i + 1}/${modelsToTry.length} ---`);
      console.log(`Trying model: ${modelName}`);
      console.log(`Full URL: ${modelUrl}`);
      console.log(`Request payload:`, JSON.stringify({ inputs: text }));
      
      const response = await fetch(modelUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiToken}`,
          "Content-Type": "application/json",
          "User-Agent": "Floot-Task-Assistant/1.0",
        },
        body: JSON.stringify({ inputs: text }),
      });
      
      console.log(`Response status: ${response.status} ${response.statusText}`);
      console.log(`Response headers:`, Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Hugging Face API error for model ${modelName}:`);
        console.error(`Status: ${response.status} ${response.statusText}`);
        console.error(`Error body:`, errorBody);
        
        // Try to parse error as JSON for more details
        try {
          const errorJson = JSON.parse(errorBody);
          console.error(`Parsed error:`, JSON.stringify(errorJson, null, 2));
        } catch {
          console.error(`Error body is not valid JSON`);
        }
        
        // If this is not the last model to try, continue to next model
        if (i < modelsToTry.length - 1) {
          console.log(`Trying next model...`);
          continue;
        } else {
          console.log(`All Hugging Face models failed. Falling back to rule-based sentiment analysis.`);
          return ruleBasedSentiment(text);
        }
      }

      const result = await response.json();
      console.log(`Success! API response from ${modelName}:`, JSON.stringify(result, null, 2));
      
      // Handle different response formats from different models
      let sentiment = 'NEUTRAL';
      
      // First, handle nested array format: [[{label, score}, ...]] -> [{label, score}, ...]
      let processedResult = result;
      if (Array.isArray(result) && result.length > 0 && Array.isArray(result[0])) {
        console.log(`Detected nested array format, flattening...`);
        processedResult = result[0];
      }
      
      if (Array.isArray(processedResult) && processedResult.length > 0) {
        // Validate that we have proper classification objects with label and score
        const validResults = processedResult.filter((item: any) => 
          item && typeof item === 'object' && 'label' in item && 'score' in item && 
          typeof item.label === 'string' && typeof item.score === 'number'
        );
        
        if (validResults.length === 0) {
          console.warn(`No valid classification results found in response:`, processedResult);
          sentiment = 'NEUTRAL';
        } else {
          // Standard classification format: [{ "label": "POSITIVE", "score": 0.99... }, ...]
          const topResult = validResults.reduce((prev: any, current: any) => (prev.score > current.score) ? prev : current);
        
        // Different models use different label formats
        const labelMappings: { [key: string]: string } = {
          // Standard sentiment labels
          'POSITIVE': 'POSITIVE',
          'NEGATIVE': 'NEGATIVE',
          'NEUTRAL': 'NEUTRAL',
          // Star ratings format (nlptown/bert-base-multilingual-uncased-sentiment)
          '1 stars': 'NEGATIVE',
          '2 stars': 'NEGATIVE', 
          '3 stars': 'NEUTRAL',
          '4 stars': 'POSITIVE',
          '5 stars': 'POSITIVE',
          '1 star': 'NEGATIVE',
          '2 star': 'NEGATIVE', 
          '3 star': 'NEUTRAL',
          '4 star': 'POSITIVE',
          '5 star': 'POSITIVE',
          // DistilBERT labels
          'LABEL_0': 'NEGATIVE',
          'LABEL_1': 'POSITIVE',
          // RoBERTa sentiment labels
          'LABEL_2': 'NEUTRAL',
          // Twitter RoBERTa labels
          'negative': 'NEGATIVE',
          'positive': 'POSITIVE',
          'neutral': 'NEUTRAL',
          // Go emotions model - map emotions to sentiment
          'joy': 'POSITIVE',
          'optimism': 'POSITIVE',
          'love': 'POSITIVE',
          'excitement': 'POSITIVE',
          'gratitude': 'POSITIVE',
          'pride': 'POSITIVE',
          'approval': 'POSITIVE',
          'caring': 'POSITIVE',
          'admiration': 'POSITIVE',
          'relief': 'POSITIVE',
          'sadness': 'NEGATIVE',
          'anger': 'NEGATIVE',
          'fear': 'NEGATIVE',
          'disappointment': 'NEGATIVE',
          'disapproval': 'NEGATIVE',
          'annoyance': 'NEGATIVE',
          'grief': 'NEGATIVE',
          'embarrassment': 'NEGATIVE',
          'nervousness': 'NEGATIVE',
          'remorse': 'NEGATIVE',
          'disgust': 'NEGATIVE',
          // Default neutral for other emotions
          'surprise': 'NEUTRAL',
          'curiosity': 'NEUTRAL',
          'confusion': 'NEUTRAL',
          'realization': 'NEUTRAL',
          'desire': 'NEUTRAL',
          'amusement': 'POSITIVE' // Generally positive
        };
        
          // Safely handle label processing with proper checks
          const label = topResult.label;
          if (label && typeof label === 'string') {
            sentiment = labelMappings[label.toLowerCase()] || 'NEUTRAL';
          } else {
            console.warn(`Invalid or missing label in response:`, topResult);
            sentiment = 'NEUTRAL';
          }
          console.log(`Sentiment mapping: ${topResult.label} -> ${sentiment} (confidence: ${topResult.score ? topResult.score.toFixed(3) : 'N/A'})`);
        }
        
      } else if (processedResult && typeof processedResult === 'object' && 'label' in processedResult) {
        // Single result format - validate structure
        if (typeof processedResult.label === 'string') {
          const labelMappings: { [key: string]: string } = {
            'POSITIVE': 'POSITIVE',
            'NEGATIVE': 'NEGATIVE',
            'NEUTRAL': 'NEUTRAL',
            'positive': 'POSITIVE',
            'negative': 'NEGATIVE',
            'neutral': 'NEUTRAL',
          };
          sentiment = labelMappings[processedResult.label.toLowerCase()] || 'NEUTRAL';
          console.log(`Single result sentiment: ${processedResult.label} -> ${sentiment}`);
        } else {
          console.warn(`Invalid label type in single result:`, processedResult);
          sentiment = 'NEUTRAL';
        }
      } else {
        console.warn(`Unexpected response format from ${modelName}:`, JSON.stringify(processedResult));
        sentiment = 'NEUTRAL';
      }
      
      console.log(`Final sentiment result: ${sentiment}`);
      return sentiment;
      
    } catch (error) {
      console.error(`Error with model ${modelName}:`, error);
      if (error instanceof Error) {
        console.error(`Error message: ${error.message}`);
        console.error(`Error stack:`, error.stack);
      }
      
      // If this is not the last model to try, continue to next model
      if (i < modelsToTry.length - 1) {
        console.log(`Trying next model due to error...`);
        continue;
      } else {
        console.error("All sentiment analysis models failed due to errors.");
        console.log("Falling back to rule-based sentiment analysis");
        return ruleBasedSentiment(text);
      }
    }
  }
  
  // This should never be reached, but just in case
  console.log("Unexpected code path - falling back to rule-based sentiment analysis");
  return ruleBasedSentiment(text);
}

async function createReflectionAndUpdateProgress(trx: Transaction<DB>, input: InputType, userId: number) {
  const { taskId, emojiRating, reflectionText } = input;

  // Verify the task belongs to the authenticated user
  const task = await trx
    .selectFrom('tasks')
    .select(['id'])
    .where('id', '=', taskId)
    .where('userId', '=', userId)
    .executeTakeFirst();

  if (!task) {
    throw new Error("Task not found or access denied.");
  }

  const sentiment = await analyzeSentiment(reflectionText);

  // 1. Insert the reflection
  const [newReflection] = await trx
    .insertInto('reflections')
    .values({
      taskId,
      emojiRating,
      reflectionText,
      sentiment,
    })
    .returningAll()
    .execute();

  if (!newReflection) {
    throw new Error("Failed to create reflection record.");
  }

  // 2. Award Kaiblooms points to the authenticated user
  const updatedProgress = await trx
    .updateTable('userProgress')
    .set((eb) => ({
      kaibloomsPoints: eb('kaibloomsPoints', '+', 15),
    }))
    .where('userId', '=', userId)
    .returning('kaibloomsPoints')
    .executeTakeFirst();

  if (!updatedProgress) {
    console.warn(`User progress record for user ID ${userId} not found. Could not award points.`);
  } else {
    console.log(`Awarded 15 Kaiblooms. New total: ${updatedProgress.kaibloomsPoints}`);
  }

  return { ...newReflection, sentiment };
}

export async function handle(request: Request) {
  try {
    // Get authenticated user
    const { user } = await getServerUserSession(request);

    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    const newReflection = await db.transaction().execute(async (trx) => {
      return createReflectionAndUpdateProgress(trx, input, user.id);
    });

    return new Response(superjson.stringify(newReflection satisfies OutputType), {
      headers: { 'Content-Type': 'application/json' },
      status: 201,
    });
  } catch (error) {
    console.error("Error creating reflection:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: `Failed to create reflection: ${errorMessage}` }), { status: 500 });
  }
}