## **Take Home Assignment** 

Suppose you are a Senior Full Stack Engineer at WingsFin Ltd. The product team needs two new real-time features: 

- A line chart showing real-time updates of an index value (example: DSEX from the Dhaka Stock Exchange) 

- A line chart showing real-time updates of a stock price (example: GP) 

## **Data Source** 

The data source pushes updates whenever new data is available. 

## **Example payload for index value** 

```
{
  "index_id": "DSEX",
  "time": 1779336701000,
  "capital_value": 5222.22,
  "percentage_change_from_yesterday_close_value": 4.12
}
```

## **Example payload for stock price** 

```
{
  "trade_code": "GP",
  "time": 1779336913000,
  "close_price": 238.79,
  "yesterday_close_price": 238.88
```

```
}
```

## **Notes** 

- Data does not arrive at fixed intervals. 

- Updates are pushed only when a new value is available. 

- If no new update arrives for a symbol, the latest known value should be considered unchanged. 

## **Chart Behavior** 

## **Market Status** 

- Charts should only display data when the market is OPEN. 

- When the market is CLOSED, show an appropriate message instead of the charts. 

## **Timeline** 

When the market is open: 

- The chart timeline (x-axis) must always represent the full market session, from market opening time to market closing time. 

- Timeline progression should be in 1-minute intervals. 

## **Initial Load** 

If a user opens the page during market hours: 

- There should be a Dropdown to select the Chart type (stock or index). By default, index will be selected. 

- Historical data from market opening time up to the current time should be shown in the chart. 

- Data should be plotted at 1-minute intervals. 

## **Live Updates** 

- The chart should continue updating in real time until: 

   - the user leaves the page, or 

   - the market closes. 

- If multiple updates arrive within the same minute, the latest value for that minute should be used. 

- The latest point on the chart must always represent the current minute. 

- There must not be any missing minutes in the timeline. 

- The latest value/price must be shown in the top right corner of the chart. 

## **Visual Requirements** 

## Both charts should include: 

- A dotted horizontal reference line representing yesterday’s closing price/value. 

Point colors should follow these rules: 

- Above the dotted line: `#7327F5` 

- Below the dotted line: `#F52738` 

- Equal to the dotted line: `#EE27F5` 

Additionally: 

- The latest point on the chart should have a blinking/heartbeat animation to indicate live activity. 

- Hovering on each point should show value and time for that point 

## **Technical Requirements** 

## **Backend** 

- Must be developed using Node.js 

- Any Node.js framework may be used 

## **Frontend** 

- Must be developed using React.js 

## **Database** 

- Must use PostgreSQL (and/or its ecosystem) 

## **System Expectations** 

- Page load time should be as low as possible 

- Chart Time to Interactive (TTI) should be as low as possible 

- Real-time updates should feel instantaneous 

- The solution should be scalable with minimal increase in resource consumption 

- Everything must be dockerized 

## **Testing Requirements** 

To help us evaluate the submission: 

- A README must clearly explain how to run and test the project 

- Preferably, running `docker compose up` should be enough to start the full system 

## **Configuration** 

- Market open/close hours should be configurable through environment variables or configuration files 

## **Seed Data** 

- Implement a strategy to seed historical data for testing mid-market scenarios 

- Seeded data should not use uniform intervals, as that would not reflect real-world behavior 

## **Data Simulation** 

- Implement a way to simulate arbitrary real-time updates (in <=3 second unequal intervals) from the source 

- For index, keep the range -100 and +100 from the yesterday close value and make it fluctuate from that value point so that the fluctuation and color changing line is more apparent. For stock, the range can be –1 and +1. 

## **Deliverables** 

Please submit: 

- A GitHub repository containing all source code and related artifacts 

- An architecture diagram 

- A document explaining: 

   - system architecture 

   - design decisions 

   - technology choices 

   - trade-offs and justifications 

- A README with setup and testing instructions 

- A short demo video showing: 

   - how to run the project 

   - frontend behavior and live update flow 

