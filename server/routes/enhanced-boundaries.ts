import { Request, Response } from 'express';
import { searchBoundaries } from '../services/osmService';

export async function POST(req: Request, res: Response) {
  try {
    const { city, country, locode } = req.body;
    
    if (!city || !country) {
      return res.status(400).json({ 
        error: 'City and country are required' 
      });
    }

    console.log(`🔍 Fetching enhanced boundaries for ${city}, ${country}`);
    
    // Fetch boundaries using OSM service  
    const boundaries = await searchBoundaries({
      cityName: city,
      country: country,
      limit: 5
    });

    console.log(`✅ Found ${boundaries.length} boundaries for ${city}`);
    
    return res.json({
      boundaries: boundaries
    });
    
  } catch (error) {
    console.error('Error in enhanced boundaries endpoint:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch enhanced boundaries' 
    });
  }
}