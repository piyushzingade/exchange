

interface Order {
    orderId : string
    price : number
    quantity :number
}

interface Bid extends Order {
    side  :"bid"
}

interface Ask extends Order {
    side : "ask"
}

interface OrderBook {
    bids: Bid[]
    asks : Ask[]
}

export const orderbook : OrderBook  = {
    bids: [],
    asks : []
}


export const bookWithQuantity : {bids :{[price : number]:number}; asks :{[price : number] : number}}= {
    bids:{

    } ,
    asks:{

    }
}
