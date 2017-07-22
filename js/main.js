function getHosts({ batchNum }) {
  this.cache = this.cache || {};
  const batchSize = 10;

  return new Promise((resolve, reject) => {

    $.ajax('/get-hosts', {
      success: (data) => {
        data.shift();
        let batch = 0;

        while (data.length > 0) {
          this.cache[batch++] = data.splice(0, batchSize);
        }

        return resolve({
          data: this.cache[batchNum],
          batchNum: batchNum,
          batchCount: Object.keys(this.cache).length - 1
        });
      }, error: (err) => {
        reject(err);
      }
    });
  })
}

function deleteHost(id) {
  return new Promise((resolve, reject) => {
    $.ajax('/delete-host', {
      success: (data) => {
        return resolve(data);
      }, error: (err) => {
        reject(err);
      }
    });
  })
}

function deleteHosts(ids) {
  return new Promise((resolve, reject) => {
    const responses = new Array(ids.length);
    let count = 0;
    ids.forEach((id, i) => {
      deleteHost(id).then((data) => {
        responses[i] = data;
        if (count === (ids.length - 1)) {
          resolve(responses);
        }
        count += 1;
      }).catch((error) => {
        responses[i] = { status: error.status };
        if (count === (ids.length - 1)) {
          resolve(responses);
        }
        count += 1;
      });
    });

  });
}

function main() {
  const hostList = $('#hosts-dropdown-button').hostlist({

    onBatchRequested(event, { batchNum }) {
      getHosts({ batchNum })
        .then(batch => {
          $(this).hostlist('addHosts', batch.data);
          if (batch.batchNum === batch.batchCount) {
            $(this).hostlist('option', 'moreToShow', false);
          }
        }).catch(error => {
          $(this).hostlist('option', 'errors', [error]);
        })
    },

    onClose(event, { selectedHosts }) {
      console.log(selectedHosts);
    },

    onDeleteHosts(event, { hostsToDelete }) {
      const ids = hostsToDelete.map(host => host.id);
      const errors = [];
      deleteHosts(ids).then(results => {
        const toDeleteList = results.reduce((toDelete, result, i) => {
          if (result.success) {
            toDelete.push(ids[i]);
          } else {
            errors.push(result);
          }
          return toDelete;
        }, []);
        $(this).hostlist('removeHosts', toDeleteList);
        $(this).hostlist('option', 'errors', errors);
      });
    }, 

    addRandomHost() {
      $(this).hostlist('addHosts', [Mock.getRandomHost()]);
    }
  });
}


main();