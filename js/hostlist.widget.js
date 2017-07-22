(function() {

  const showMoreButtonTemplate = `
    <div class="ld-hosts-dropdown--inside-button loading" id="ld-show-more-button">
      <span>Show More</span>
      <div class="ld-hosts-dropdown--loading-wheel">
    </div>
  `;

  const errorButtonTemplate = `
    <div class="ld-hosts-dropdown--inside-button" id="ld-error-button">
      <span>Try Again</span>
    </div>
  `;

  const errorTemplate = `
    <img src="./images/error.svg" />
    <div>An error has occurred!</div>
  `;

  const template = `
    <div class="ld-hosts-dropdown" tabindex="1">
      <div class="ld-hosts-dropdown--options" tabindex="1">
        <input class="ld-hosts-dropdown--search" id="ld-hosts-search" type="text" placeholder="Search..." />
        <div class="ld-hosts-dropdown--tools">
          <div class="ld-hosts-dropdown--tool" id="ld-hosts-sort-button">
            <img src="./images/sort-icon.svg" />
            Sort
          </div>
          <div class="ld-hosts-dropdown--tool" id="ld-hosts-delete-button">
            <img src="./images/delete-icon.svg" />
            Delete
          </div>
          <div class="ld-hosts-checkbox" id="ld-hosts-select-all"></div>
        </div>
      </div>
      <div class="ld-hosts-dropdown--divider"></div>
      <div class="ld-hosts-dropdown--host-list-wrapper">
        <div class="ld-hosts-dropdown--host-list" id="ld-hosts-list">
          ${showMoreButtonTemplate}
        </div>
        </div>
      </div>
    </div>
  `;

  $.widget('logdna.hostlist', {

      options: {
        moreToShow: true,
        errors: []
      },

      _create() {
        this._dropdown = $(template);
        this.element.append(this._dropdown);
        this._hostList = $('#ld-hosts-list');
        this._searchInput = $('#ld-hosts-search');
        this._batchNum = 0;
        this._hostListData = [];
        this._dropdown.hide();

        this.element.click(this._onButtonClick.bind(this));
        this._dropdown.click(e => e.stopPropagation());
        $('#ld-hosts-sort-button').click(this._onSort.bind(this));
        $('#ld-hosts-delete-button').click(this._onDelete.bind(this));
        this._searchInput.on('input', this._render.bind(this));
        $('#ld-hosts-select-all').click(this._onSelectAll.bind(this));
        $('#add-random-host').click(this._addRandomHost.bind(this));
        this._trigger("onBatchRequested", null, { batchNum: this._batchNum });

        $(document).click(e => {
          if (this._dropdown.is(':visible')) {
            this._dropdown.hide();
            this._trigger("onClose", e, { selectedHosts: this._getSelected() });
          }
        });
      },

      _setOption(key, value) {
        if (key === "moreToShow" && value === false) {
          this._showMoreButton.hide();
        } else if (key === "errors" && Array.isArray(value)) {
          this.options.errors = value;
          this._render();
        }
        this._super(key, value);
      },

      _onSort() {
        this._hostListData.reverse();
        this._render();
      },

      _addRandomHost() {
        this._trigger("addRandomHost", null, {});
      },

      _onShowMore(e) {
        this._showMoreButton.addClass('loading');
        this._trigger("onBatchRequested", null, { batchNum: ++this._batchNum });
      },

      _onDelete() {
        const hostsToDelete = this._getSelected();
        this._trigger("onDeleteHosts", null, { hostsToDelete });
      },

      _getSelected() {
        return this._hostListData.filter(host => host.selected);
      },

      _onSelectAll(e) {
        if (this.options.errors.length > 0) { return; }
        $(e.target).toggleClass('selected');
        const filteredList = this._getFilteredList();
        const isSelected = $(e.target).hasClass('selected');

        filteredList.forEach(host => {
          host.selected = isSelected;
        });
        this._render();
      },

      _getFilteredList() {
        const queryString = this._searchInput.val();
        this.options.moreToShow = (queryString.length <= 0);

        const matches = this._hostListData.reduce((filtered, host) => {
          const matchStart = host.name.toLowerCase().indexOf(queryString.toLowerCase());

          Object.assign(host, {
            matchStart: (matchStart > -1) ? matchStart : undefined,
            matchLength: (matchStart > -1) ? queryString.length : undefined
          });

          if (matchStart > -1) {
            filtered.push(host);
          }

          return filtered;
        }, []);

        return matches;
      },

      _onCheckboxClicked(e) {
        const hostListData = this._getFilteredList();
        const index = e.target.getAttribute('data-index');
        $(e.target).toggleClass('selected');
        if (hostListData[index]) {
          hostListData[index].selected = !hostListData[index].selected;
        }
      },

      _onButtonClick(e) {
        e.stopPropagation();
        if (this._dropdown.is(':visible')) {
          this._trigger("onClose", e, { selectedHosts: this._getSelected() });
        }
        this._dropdown.toggle();
      },

      _render() {
        const hostListData = this._getFilteredList();

        const listItems = hostListData.map(({ name, id, matchStart, matchLength, selected }, index) => {
          let nameParts = [name,'',''];
          if (typeof matchStart !== 'undefined' && matchLength) {
            nameParts = [
                name.slice(0, matchStart),
                name.slice(matchStart, matchStart + matchLength),
                name.slice(matchStart + matchLength, name.length),
            ];
          }
          const selectedClass = selected ? 'selected' : '';
          return `
            <div class="ld-host-dropdown--host">
              <span>${nameParts[0]}</span>
              <span class="ld-host-dropdown--host-match">${nameParts[1]}</span>
              <span>${nameParts[2]}</span>
              <div class="ld-hosts-checkbox listitem ${selectedClass}" id="checkbox-${id}" data-index="${index}"></div>
            </div>
          `;
        });

        let button = this.options.moreToShow ? showMoreButtonTemplate : '';
        button = this.options.errors.length ? errorButtonTemplate : button;
        const body = this.options.errors.length ? errorTemplate : listItems.join('');

        this._hostList.html(
          `${body}
          ${button}`
        );
        this._showMoreButton = $('#ld-show-more-button');
        this._showMoreButton.removeClass('loading');

        this._showMoreButton.click(this._onShowMore.bind(this));
        $('.ld-hosts-checkbox.listitem').click(this._onCheckboxClicked.bind(this));
        $('#ld-error-button').click(() => this.option("errors", []));
      },

      removeHosts(ids) {
        const hostsToKeep = this._hostListData.filter(host => {
          return !ids.includes(host.id);
        });
        $('#ld-hosts-select-all').removeClass('selected');
        this._hostListData = hostsToKeep;
        this._render();
      },

      addHosts(hostList) {
        const compareOptions = { numeric: true, sensitivity: 'base' };
        this._hostListData = [...this._hostListData, ...hostList]
            .sort((a, b) => a.name.localeCompare(b.name, undefined, compareOptions));
        this._render();
      }
  });

})();