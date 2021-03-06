import React, { Component } from 'react';
import { Button, Modal, Table } from 'react-bootstrap';
import axios from 'axios';
import $ from 'jquery';
import _ from 'lodash';
import helpers from '../helpers';

import server from '../../server/config/config';

import CharityModalEntry from './CharityModalEntry';

class CharityModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      charities: [],
      updatedCharities: [],
      userEmail: '',
      donationTotal: 0
    };

    this.updateCharities = this.updateCharities.bind(this);
    this.saveCharities = this.saveCharities.bind(this);
    this.updateTotal = this.updateTotal.bind(this);
    this.close = this.close.bind(this);
  }

  componentDidMount () {
    var cookies = helpers.parseCookie(document.cookie);
    this.setState({
      userEmail: cookies.email || '',
    });
    axios.post(server + '/api/user/charities/info', {
      email: cookies.email
    })
    .then((res) => {
      var usersCharities = res.data;
      console.log('current charities', usersCharities);
      // If there is a current charity (if not, on user profile page)
      if (Object.keys(this.props.currentCharity).length) {
        this.props.currentCharity.percentage = 0;
        if (!usersCharities) {
          usersCharities = [this.props.currentCharity];
        } else {
          //test if current charity is already linked to user
          if (this.props.currentCharity.type === 'custom') {
            // eslint-disable-next-line 
            (((usersCharities.filter((charity) => charity.id === this.props.currentCharity.id)).length > 0) ? null : usersCharities.push(this.props.currentCharity));
          } else {
            // eslint-disable-next-line 
            (((usersCharities.filter((charity) => charity.ein === this.props.currentCharity.ein)).length > 0) ? null : usersCharities.push(this.props.currentCharity));
          }
        }
      }
      
      this.setState({
        updatedCharities: usersCharities,
        charities: usersCharities
      });
    })
    .catch((err) => {
      console.log(err);
    });
  }

  updateTotal (percentage) {
    // eslint-disable-next-line 
    var newTotal = (this.state.donationTotal += percentage);
    newTotal = Math.round(newTotal * 100) / 100;
    this.setState( { donationTotal: newTotal} );
  }

  close() {
    this.props.onHide();
    this.setState({ donationTotal: 0 });
  }

  updateCharities (index, charityId, remove, percentage) {
    let updates = $.extend(true, [], this.state.updatedCharities);
    updates[index].remove = remove;
    updates[index].id = charityId;
    updates[index].percentage = percentage;
    this.setState({ updatedCharities: updates });
  }

  saveCharities () {
    console.log('this is getting sent to the database', this.state.updatedCharities);
    this.setState( {charities: this.state.updatedCharities});
    axios.post(server + '/api/user/charities/update', {
      email: this.state.userEmail,
      charities: this.state.updatedCharities
    })
    .then((res) => {
      if (this.props.updateProfile) {
        this.props.updateProfile(this.state.updatedCharities);
      }
    })
    .catch((err) => {
      console.log(err);
    });
    this.close();
  }

  render() {
    return (
      <Modal className="charityModal" show={this.props.show} onHide={this.close}>
        <Modal.Header closeButton>
          <Modal.Title>Update Your Charity Selections</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Table>
            <thead>
              <tr>
                <th>Charity Name</th>
                <th>Your Donations</th>
                <th>Current Percentage Donation</th>
                <th>Remove Charity</th>
              </tr>
            </thead>

            <tbody>
              {this.state.charities.map((charity, i) =>
                <CharityModalEntry
                  key={i}
                  index={i}
                  charity={charity}
                  updateTotal={this.updateTotal}
                  updateCharities={ this.updateCharities }/>
              )}
            </tbody>
          </Table>

        </Modal.Body>

        <Modal.Footer>
          <div className="percentageError">{this.state.donationTotal !== 1 ? <div>Donations must add to 100%</div> : null}</div>
          <Button bsStyle="primary" onClick={this.saveCharities} disabled={this.state.donationTotal !== 1} >Save</Button>
          <Button onClick={this.close}>Cancel</Button>
        </Modal.Footer>
      </Modal>
    );
  }
}


export default CharityModal;
