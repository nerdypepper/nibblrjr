const d3 = Object.assign({},
    require('d3-selection'),
    require('d3-scale'),
    require('d3-axis'),
);


function rect({ x, y, width, height, radius }) {
    if (radius > height) {
        radius = height;
    }

    if (width < radius * 2) {
        radius = width /2;
    }

    return `
        M${x},${y + height}
        v${-height + radius}
        a${radius},${radius} 0 0 1 ${radius},${-radius}
        h${width - 2*radius}
        a${radius},${radius} 0 0 1 ${radius},${radius}
        v${height - radius}
        z
    `.replace(/\s\s+/g, ' ');
}

export default class BarChart {
    config = {
        margin: {
            top: 5, right: 20, bottom: 40, left: 60,
        },
        height: 400,
        data: undefined,
        accessor: undefined,
    };

    get dimensions() {
        const { top, right, bottom, left } = this.config.margin;
        return {
            width: this.outerWidth - left - right,
            height: this.config.height - top - bottom,
            top,
            right,
            bottom,
            left,
        };
    }

    container;
    svg;
    main;
    contents;
    xAxisG;
    yAxisG;
    xAxis;
    yAxis;
    xScale;
    yScale;
    outerWidth;

    constructor(node) {
        this.container = d3.select(node);
        this.container.selectAll('*').remove();

        this.svg = this.container.append('svg');
        this.main = this.svg.append('g');
        this.contents = this.main.append('g');

        this.xAxisG = this.main
            .append('g')
            .attr('class', 'axis x');
        this.yAxisG = this.main
            .append('g')
            .attr('class', 'axis y');

        window.addEventListener('resize', this.resize);
    }

    // public

    destroy = () => {
        window.removeEventListener('resize', this.resize);
    };

    data = (data, accessor) => {
        this.config.data = data;
        this.config.accessor = accessor;
        return this;
    };

    setWidth = () => {
        this.outerWidth = this.container.node().getBoundingClientRect().width;
    };

    resize = () => {
        this.render();
    };

    render = () => {
        this.setWidth();
        const { width, height, top, right, bottom, left } = this.dimensions;

        // set margins / size
        this.svg
            .attr('width', width + left + right)
            .attr('height', height + top + bottom);
        this.main
            .attr('transform', `translate(${[left, top]})`);

        // scales

        const domainMax = this.config.data.reduce((a, c) => Math.max(a, c.count), 0);
        this.yScale = d3.scaleLinear()
            .domain([0, domainMax])
            .range([height, 0]);
        this.xScale = d3.scaleBand()
            .paddingInner(1 / 3)
            .paddingOuter(1 / 6)
            .rangeRound([0, width])
            .domain(this.config.data.map((d) => d.user));
        this.xAxis = d3.axisBottom(this.xScale)
            .tickSize(10)
            // force correct label
            // .tickFormat((d, i) => this.dataObj[i].name);
        this.xAxisG
            .attr('transform', `translate(0,${height})`)
            .call(this.xAxis)
            .selectAll('text')
            .style('text-anchor', 'end')
            .attr('dx', '-.8em')
            .attr('dy', '.55em')
            .attr('transform', 'rotate(-14)' );
        this.yAxis = d3.axisLeft(this.yScale)
            .tickSize(10)
            .ticks(12);
        this.yAxisG
            .call(this.yAxis);

        const barsSelect = this.contents.selectAll('.bar')
            .data(this.config.data, this.config.accessor);

        barsSelect.exit().remove();

        const barsEnter = barsSelect.enter();

        barsEnter
            .append('path')
            .classed('bar', 1)
            .merge(barsSelect)
            .attr('d', d => rect({
                x: this.xScale(d.user),
                width: this.xScale.bandwidth(),
                height: Math.abs(this.yScale(d.count) - this.yScale(0)),
                y: this.yScale(Math.max(0, d.count)),
                radius: 3,
            }))
            // .attr('x', (d) => this.xScale(d.user))
            // .attr('width', this.xScale.bandwidth())
            // .attr('height', (d) => (
            //     Math.abs(this.yScale(d.count) - this.yScale(0))
            // ))
            // .attr('y', (d) => this.yScale(Math.max(0, d.count)));

    };

};