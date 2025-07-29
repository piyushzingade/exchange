
import { Router } from "express"
import { RedisManager } from "../RedisManager";
import { CANCEL_ORDER, CREATE_ORDER, GET_OPEN_ORDERS } from "../types";
export const orderRouter = Router();

orderRouter.post("/" , async (req , res)=>{
    try {
        const { price, quantity, userId, market, side } = req.body;
        if (!price || !quantity || !userId || !market || !side) {
            return res
              .status(400)
              .send("Some required fields are missing in Order Router");

        }

        const response = await RedisManager.getInstance().sendAndAwait({
          type: CREATE_ORDER,
          data: {
            market,
            price,
            quantity,
            side,
            userId,
          },
        });

        // res.json(response.payload)
        res.send("Updated")
    } catch (error) {
        console.log("Error in create Order :" , error)
        res.status(403).send("Error in place order / route ");
    }
})

orderRouter.delete("/" , async (req , res)=>{
  try {
    const { orderId, market } = req.body;

    const response = await RedisManager.getInstance().sendAndAwait({
      type: CANCEL_ORDER,
      data: {
        orderId,
        market,
      },
    });

    res.status(200).json(response.payload)
  } catch (error) {
    console.log("Error in deleti route of order")
    res.status(403).send("Error in delete / route ");

  }
})

orderRouter.get("/open" , async(req , res)=>{
  try {
    const response = await RedisManager.getInstance().sendAndAwait({
      type: GET_OPEN_ORDERS,
      data : {
        userId  : req.query.userId as string,
        market :req.query.market as string

      }
    })

    res.status(200).json(response.payload)
  } catch (error) {
    console.log("Error in getting order on order router" ,error)
    res.status(403).send("Error in /open route ")
  }
})