'use strict';

(function() {

  let restaurantData = "no data";
  let allRestaurantsData = "no data";
  let svgLineGraph = "";
  let svgBarGraph = "";

  // load data and make scatter plot after window loads
  window.onload = function() {
    svgLineGraph = d3.select('body')
      .append('svg')
      .attr('width', 500)
      .attr('height', 500);
    // d3.csv is basically fetch but it can be be passed a csv file as a parameter
    d3.csv("./data/Datafiniti_Fast_Food_Restaurants.csv")
      .then((csvData) => {
        allRestaurantsData = csvData;
        makeDropdown();
        makeLineGraph("McDonald's"); //default country
      });
  }
  
  //make dropdown and buttons that select previous or next year
  function makeDropdown() {

    //dropdown with years as selections
    let dropDown = d3.select("body").append("div")
      .append("select")
      .attr("class", "dropdown"); //for styling

    // get array of years
    let optionData = d3.map(allRestaurantsData, function(d) {return d.name;}).keys();

    let options = dropDown.selectAll("option")
      .data(optionData)
      .enter()
      .append("option")

    options.text(function (d) {return d; })
      .attr("value", function (d) {return d; })
      .property("selected", function(d) {return d === "McDonald's";});

    dropDown.on("change", function() {
      let restaurant = this.value;
      makeLineGraph(restaurant);
    });
  }

  function makeLineGraph(restaurant) {
    svgLineGraph.html("");
    restaurantData = allRestaurantsData.filter((row) => row["name"] == restaurant);

    var margin = {top: 10, right: 20, bottom: 30, left: 10},
    width = 500 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

    let date = restaurantData.map((row) => row["dateAdded"]);
    let xyValues = getxyValues(date);
    let years = xyValues.uniqueYears;
    let amountAdded = xyValues.restaurantAmount;

    // scale, draw, and label x-axis
    let funcs = makeAxes(width, height, years, amountAdded);

    // // plot data as points and add tooltip functionality
    plotLineGraph(funcs, years, amountAdded);

    // draw title and axes labels
    makeLabels(restaurant);
  }

  //make a list of unique years
  function getxyValues(date) {
    let uniqueYears = [];
    let restaurantAmount = [];
    for (let i = 0; i < date.length; i++) {
      let year = +parseYear(new Date(date[i]));
      if (!uniqueYears.includes(year)) {
          uniqueYears.push(year);
          restaurantAmount.push(0);
      }
    }
    uniqueYears.sort();
    for (let i = 0; i < date.length; i++) {
      let year = +parseYear(new Date(date[i]));
      for (let j = 0; j < uniqueYears.length; j++) {
        if (year == uniqueYears[j]) {
          restaurantAmount[j]++;
        }
      }
    }
    return {
      uniqueYears: uniqueYears,
      restaurantAmount: restaurantAmount
    };
  }

  function parseYear(date) {
    let parse = d3.timeFormat("%Y");
    return parse(date);
  }

    //draw axes and ticks
  function makeAxes(width, height, x, y) {

    var xScale = d3.scaleBand()
        .domain(x)
        .range([0, width]);

    var yScale = d3.scaleLinear()
      .domain([d3.max(y) + 2, 0])
      .range([30, height]);

    var xAxis = d3.axisBottom(xScale)
      .scale(xScale);

    var yAxis = d3.axisLeft()
      .scale(yScale);

    svgLineGraph.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(50," + height + ")")
        .call(xAxis)
        .selectAll("text")
        .style("font-size", "8px")
          .style("text-anchor", "end")
          .attr("dx", "-.8em")
          .attr("dy", "-.55em")
          .attr("transform", "rotate(-90)" );

    svgLineGraph.append("g")
        .attr("class", "y axis")
        .attr('transform', 'translate(50, 0)')
        .call(yAxis);

    return {
      xScale: xScale,
      yScale: yScale,
      width: width,
      height: height
    }
  }

  // plot all the data points on the SVG
  // and add tooltip functionality
  function plotLineGraph(funcs, x, y) {

    // mapping functions
    let xMap = x;
    let xScale = funcs.xScale;
    let yMap = y;
    let yScale = funcs.yScale;

    // make tooltip
    let div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

    let line = d3.line()
    .x(function(d, i) {return xScale(xMap[i]) + (funcs.width/xMap.length);})
    .y(function(d, i) {return yScale(yMap[i]);});

    svgLineGraph.selectAll(".dot")
      .data(restaurantData)
      .enter()
      .append("circle")
      .attr("cx", function(d, i) {return xScale(xMap[i]) + (funcs.width/xMap.length);})
      .attr("cy", function(d, i) {return yScale(yMap[i]);})
      .attr("r", 3)
      .on("mouseover", (d) => {
        div.transition()
          .duration(200)
          .style("opacity", .9)
          .style("eft", (d3.event.pageX) + "px")
          .style("top", (d3.event.pageY - 28) + "px");
        makeBarGraph();
      })
      .on("mouseout", (d) => {
        div.transition()
          .duration(500)
          .style("opacity", 0);
      });

    svgLineGraph.append('path')
      .datum(restaurantData)
      .attr('fill', 'none')
      .attr("stroke", "steelblue")
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("stroke-width", 1.5)
      .attr("d", line)
        // add tooltip functionality to points
      .on("mouseover", (d) => {
        div.transition()
          .duration(200)
          .style("opacity", .9)
          .style("eft", (d3.event.pageX) + "px")
          .style("top", (d3.event.pageY - 28) + "px");
        makeBarGraph();
      })
      .on("mouseout", (d) => {
        div.transition()
          .duration(500)
          .style("opacity", 0);
      });

    svgBarGraph = div.append("svg")
      .attr('width', 1000)
      .attr('height', 500);
  }

  // make histogram graph with data
  function makeBarGraph() {
    svgBarGraph.html("");

    var margin = {top: 10, right: 20, bottom: 30, left: 10},
    width = 800 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

    let provinces = restaurantData.map((row) => row["province"]);

    var provinceCount = {};
    provinces.forEach(element => {
      if (!provinceCount.hasOwnProperty(element)) {
        provinceCount[element] = 1;
      } else {
        provinceCount[element]++;
      }
    });
    var provinceData = [];
    for (var province in provinceCount) {
      if (provinceCount.hasOwnProperty(province)) {
        provinceData.push({
          province: province,
          count: provinceCount[province]
        });
      }
    }

    // scale, draw, and label x-axis
    var x = d3.scaleBand()
        .domain(provinceData.map(function(d) {return d.province;}))
        .range([0, width]);
        
    svgBarGraph.append("text")
      .attr('x', 250)
      .attr('y', 500)
      .style('font-size', '10pt')
      .text("Provinces");

    svgBarGraph.append("g")
        .attr("transform", "translate(40," + height + ")")
        .call(d3.axisBottom(x));

    var y = d3.scaleLinear()
      .domain([0, d3.max(provinceData, function (d) {return d.count;})])
      .range([height, 0]);

    svgBarGraph.append("text")
      .attr("transform", "translate(15, 300)rotate(-90)")
      .style('font-size', '10pt')
      .text("Amount of Restaurants");

    svgBarGraph.append("g")
      .attr("transform", "translate(40, 0)")
      .call(d3.axisLeft(y));
  
    svgBarGraph.selectAll(".bar")
      .data(provinceData)
      .enter().append("rect")
      .attr("x", function (d) {
      return x(d.province) + 45;
  })
      .attr("width", 5)
      .attr("y", function (d) {
      return y(d.count);
  })
      .attr("height", function (d) {
      return height - y(d.count);
  })
      .style("fill", "#4286f4");
  }
  
  // make title and axes labels
  function makeLabels(restaurant) {
    svgLineGraph.append('text')
      .attr('x', 90)
      .attr('y', 20)
      .style('font-size', '14pt')
      .text("Number of " + restaurant + " Added Over Time");

    svgLineGraph.append('text')
      .attr('x', 250)
      .attr('y', 500)
      .style('font-size', '10pt')
      .text('Year');

    svgLineGraph.append('text')
      .attr('transform', 'translate(15, 300)rotate(-90)')
      .style('font-size', '10pt')
      .text('Number of ' + restaurant);
  }
})();
