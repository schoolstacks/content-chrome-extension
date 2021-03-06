import React from 'react';
import Document from '../document';
import styles from './DocumentList.scss';

export default class DocumentList extends React.Component {

  render() {
    return (
      <ul className={styles['document-list']} ref='documentList'>
        {this.props.documents.map(document => {
          return <Document key={document.id} document={document} />;
        })}
      </ul>
    );
  }
}
