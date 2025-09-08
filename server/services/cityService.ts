import { storage } from "../storage";
import { City, User } from "@shared/schema";

export async function getUserCities(user: User): Promise<City[]> {
  if (!user.projects || user.projects.length === 0) {
    return [];
  }
  
  return await storage.getCitiesByProjectIds(user.projects);
}

export async function getCityById(cityId: string): Promise<City | undefined> {
  return await storage.getCity(cityId);
}

export async function getUserAccessibleCities(userId: string): Promise<City[]> {
  const user = await storage.getUser(userId);
  if (!user) {
    throw new Error('User not found');
  }
  
  return await getUserCities(user);
}
