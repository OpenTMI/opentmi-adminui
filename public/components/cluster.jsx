class ClusterStatus extends React.Component {
  constructor(props) {
    super(props);
    this._cluster = new opentmiClient.Cluster(props.transport);
    this.state = {
      clusters: {workers: []},
      memory: [], hostCpu: [],
      loading: false, version: {}
    };
    this.updateData = this.updateData.bind(this);
    this.reloadIntervall = 1000;
  }
  componentWillUnmount() {
    if(this._updateTimeout)
      clearTimeout(this.updateData);
  }
  reload() {
    this.reloadIntervall = 500;
    this._cluster.restartWorkers()
      .then((response) => {
        //this.setState({restart: response.data});
      })
      .finally(() => {
        this.reloadIntervall = 2000;
      })
  }
  version() {
    axios
    .get('/api/v0/version', this._restOptions)
      .then((response) => {
        this.setState({version: response.data});
      });
  }
  static lessThan(date, minutesAgo = 10) {
    const DURATION = 1000 * 60 * minutesAgo;
    let anSomeTimeAgo = Date.now() - DURATION;
    return date > anSomeTimeAgo;
  }

  updateData() {
    // show the loading overlay
    this._updateTimeout = undefined;
    this.setState({loading: true});
    // fetch your data
    return this.getClusters()
      .then((data) => {
        this.state.memory.push({x: new Date(), y: data.master.memoryUsage.rss/1024/1024});
        this.state.hostCpu.push({x: new Date(), y: parseFloat(data.osStats.cpu)});

        if(!ClusterStatus.lessThan(this.state.memory[0].x)) {
          this.state.memory.splice(0, 1);
          this.state.hostCpu.splice(0, 1);
        }
        // Update react-table
        this.setState({
          clusters: data,
          memory: this.state.memory,
          hostCpu: this.state.hostCpu,
          loading: false});
      })
      .then(() => {
        this._updateTimeout = setTimeout(this.updateData, this.reloadIntervall)
      });
  }
  getClusters() {
    return this._cluster.refresh()
      .then(() => {
        return this._cluster.data;
      })
      //.catch(() => {workers: []});
  }
  render() {
    const ReactTable = window.ReactTable.default;
    const Chart = window['react-chartjs'];
    const {Line} = Chart;
    var chartData = {
      labels: [],
      datasets: [{
          label: 'Master memory Usage',
          data: this.state.memory,
          borderWidth: 1,
          fill: true,
          yAxisID: 'mem'
      },
      {
          label: 'CPU usage',
          data: this.state.hostCpu,
          borderWidth: 1,
          fill: true,
          yAxisID: 'cpu'
      }]
    };

    var chartOptions = {
      scales: {
          xAxes: [{
              ticks: {
                source: 'auto'
              },
              type: 'time',
              time: {
                  displayFormats: {
                      quarter: 'MMM YYYY hh:mm:ss'
                  }
              }
          }],
          yAxes: [{
            scaleLabel: {
                display: true,
                labelString: 'Memory [Mb]'
            },
            id: 'mem',
            type: 'linear',
            position: 'left'
          }, {
            scaleLabel: {
                display: true,
                labelString: 'avgCpu [%]'
            },
            id: 'cpu',
            type: 'linear',
            position: 'right'
          }]
      }
    };
    const tableColumns = [
      {
        Header: "Workers",
        columns: [
          {
            Header: "ID",
            accessor: "id"
          },
          {
            Header: "PID",
            id: "pid",
            accessor: o => `${o.pid}`
          },
          {
            Header: "status",
            accessor: 'status',
            Cell: row => (
              <span>
                <span style={{
                  color: row.row._original.isDead ? '#ff2e00'
                    : (row.row._original.closing || row.row._original.starting) ? '#ffbf00'
                    : '#57d500',
                  transition: 'all .3s ease'
                }}>
                  &#x25cf;
                </span> {
                  row.row._original.isDead ? 'DEAD'
                  : row.row._original.starting ? 'starting'
                  : row.row._original.isConnected ? 'OK'
                  : row.row._original.closing ? 'closing'
                  : '?!?!'
                }
              </span>)
          }
        ]
      }
    ];

    return (
      <div>
        <button onClick={this.reload.bind(this)}>reload workers</button>
        <ReactTable
          data={this.state.clusters.workers}
          loading={this.state.loading}
          onFetchData={(state, instance) => {
            this.updateData();
          }}
          columns={tableColumns}
          minRows={4}
          showPageJump={false}
          showPagination={false}
          showPaginationBottom={false}
          showPageSizeOptions={false}
          className="-striped -highlight"
        />
        <Line data={chartData} options={chartOptions} width="400" height="100"/>
      </div>
    );
  }
}
