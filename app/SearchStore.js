import remove from 'unordered-array-remove';
import superagent from 'superagent';
import bus from './bus';
import facetGroups from './facetGroups';

class SearchStore {
  constructor() {
    this.state = {
      query: {
        page: 1,
        limit: 20,
        facets: {},
        q: null
      },
      results: {
        total: 0,
        documents: [],
        facetGroups: {}
      }
    };

    this._clearFacets();

    bus.on('refresh', (query) => {
      this._performSearch();
    });

    bus.on('clearFacets', () => {
      this._clearFacets();
      this._performSearch();
    });

    bus.on('updateFacet', (group, id, isSelected) => {
      let sel = this.state.query.facets[group];
      isSelected ? sel.push(id) : remove(sel, sel.indexOf(id));
      this.state.query.page = 1;
      this._performSearch();
    });

    bus.on('updatePage', (page) => {
      this.state.query.page = page;
      this._performSearch();
    });

    bus.on('updateQ', (q) => {
      if (q === '') q = null;
      this.state.query.q = q;
      this.state.query.page = 1;
      this._performSearch();
    });
  }

  getState() {
    return this.state;
  }

  _clearFacets() {
    Object.keys(facetGroups).forEach(group => {
      this.state.query.facets[group] = []; 
    });
  }

  _computeQuery() {
    let state = this.getState();

    let query = {
      num_facets: 20,
      page: state.query.page,
      limit: state.query.limit,
      q: state.query.q
    };

    Object.entries(facetGroups).forEach(([group, groupDef]) => {
      let sel = state.query.facets[group];
      if (sel.length > 0) query[groupDef.param] = sel;
    });

    return query; 
  }

  _performSearch() {
    if (this._req) {
      this._req.abort();
    }

    this._req = superagent
      .get('http://localhost:3000/api/v1/search')
      .set('X-Api-Key', '0594aed5-e320-4344-9b73-7d7fab0bff3f')
      .query(this._computeQuery())
      .end((error, res) => {
        if (error) {
          bus.emit('searchFailed')
        } else {
          Object.assign(this.state, {
            results: {
              documents: res.body.documents,
              facetGroups: res.body.facets,
              total: res.headers['x-total']
            }
          })
          bus.emit('searchCompleted');
        }
      });
  }
}

export default new SearchStore();
