class Chart {
    constructor(sensor) {
        let self = this;

        this._outerContainer = document.createElement("div");

        this._headerContainer = document.createElement("div");
        this._outerContainer.appendChild(this._headerContainer);

        this._chartContainer = document.createElement("div");
        this._outerContainer.appendChild(this._chartContainer);

        this._downloadLink = document.createElement("a");
        this._headerContainer.appendChild(this._downloadLink);
        this._headerContainer.appendChild(document.createTextNode(" | "));

        this._downloadLink.innerText = "Download";
        this._downloadLink.style.cursor = "pointer";
        this._downloadLink.onclick = (e) => {
            self.downloadCsv();
        };

        this._closeLink = document.createElement("a");
        this._headerContainer.appendChild(this._closeLink);

        this._closeLink.innerText = "X";
        this._closeLink.style.color = "red";
        this._closeLink.style.cursor = "pointer";
        this._closeLink.style["font-weight"] = "bold";
        this._closeLink.onclick = (e) => {
            self._outerContainer.remove();
        };

        this._outerContainer.style.float = 'left';

        this._chartContainer.id = selectedSensor.name;
        this._chartContainer.style.width = '400px';
        this._chartContainer.style.height = '400px';

        this._sensor = sensor;

        if (this._sensor.format.startsWith("number_")) {
            this._options = {
                title: {
                    text: ""
                },
                tooltip: {},
                legend: {
                    data: []
                },
                xAxis: {
                    data: []
                },
                yAxis: {},
                series: [{
                    name: "",
                    type: 'line',
                    data: []
                }]
            };
        } else {
            console.log("Unsupported format:", this._sensor.format);
            return;
        }

        this._sensor.registerNewValueCallback(
            (sensor, timestamp, value) => self._updateOptions(self._sensor, timestamp, value));
    }

    downloadCsv() {
        let i = 0;
        let self = this;
        let data = Object.keys(this._sensor.history).map(key => {
            return {
                x: key,
                y: this._sensor.history[key]
            };
        });
        let encodedUri = encodeURI("timestamp," + this._sensor.name) + "%0A" + data.map(o => encodeURI(o.x + "," + o.y)).join("%0A");
        let link = document.createElement("a");
        link.setAttribute("href", "data:application/octet-stream," + encodedUri);
        link.setAttribute("download", this._sensor.name + ".csv");
        link.innerText = "Download CSV";
        this._chartContainer.appendChild(link);
        link.click();
        link.remove();
    }

    _updateOptions(sensor, timestamp, value) {

        this._options.title.text = sensor.name;
        this._options.legend.data = [sensor.name];
        this._options.series[0].name = sensor.name;

        if(!value || !timestamp) {
            let keys = Object.keys(sensor.history);
            this._options.series[0].data = keys.map(key => sensor.history[key]);
            while(this._options.series[0].data.length > 60){
                // TODO: This is performance wise pretty evil and shitty
                this._options.series[0].data.shift();
                keys.shift();
            }
            this._options.xAxis.data = keys;
        } else {
            if (this._options.series[0].data.length >= 60) {
                this._options.series[0].data.shift();
                this._options.xAxis.data.shift();
            }
            this._options.series[0].data.push(value);
            this._options.xAxis.data.push(timestamp);
        }

        if (this.chart) {
            this.chart.setOption(this._options);
        }
    }

    attach(containerId) {
        let container = document.getElementById(containerId);
        container.appendChild(this._outerContainer);
        this.chart = echarts.init(this._chartContainer);
        this._updateOptions(this._sensor);
    }
}