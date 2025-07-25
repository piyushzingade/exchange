import axios from "axios";
import { Depth, KLine, Ticker, Trade } from "./types";

export const BASE_URL = "http://localhost:3333/api/v3"


export async function getAllTicker(): Promise<Ticker[]>{
  const response  = await axios.get(`${BASE_URL}/ticket`);
  return response.data;
}


export async function getTicker(market : string) : Promise<Ticker>{

  const tickers = await getAllTicker();
  const ticker = tickers.find(t => t.symbol === market);

  if(!ticker){
    throw new Error(`No ticker found of ${market}`)
  }
  return ticker;
} 

export async function getDepth(market:string): Promise<Depth> {
  const response = await axios.get(`${BASE_URL}/depth?symbol=${market}`)
  return response.data;
}

export async function getTrade(market:string):Promise<Trade[]> {
  const response =  await axios.get(`${BASE_URL}/trade?symbol=${market}`)
  return response.data;
}

export async function getKlines(
  market: string,
  interval: string,
  startTime: number,
  endTime: number
): Promise<KLine[]> {
  const response = await axios.get(
    `${BASE_URL}/klines?symbol=${market}&interval=${interval}&startTime=${startTime}&endTime=${endTime}`
  );
  const data: KLine[] = response.data;
  return data.sort((x, y) => (Number(x.end) < Number(y.end) ? -1 : 1));
}

export async function getMarkets(): Promise<string[]> {
  const response = await axios.get(`${BASE_URL}/markets`);
  return response.data;
}