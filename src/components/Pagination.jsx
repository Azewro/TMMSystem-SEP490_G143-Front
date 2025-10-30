import React from 'react';
import { Pagination as BootstrapPagination } from 'react-bootstrap';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;

    // Previous button
    items.push(
      <BootstrapPagination.Prev
        key="prev"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      />
    );

    // First page
    if (currentPage > 3) {
      items.push(
        <BootstrapPagination.Item key={1} onClick={() => onPageChange(1)}>
          1
        </BootstrapPagination.Item>
      );
      if (currentPage > 4) {
        items.push(<BootstrapPagination.Ellipsis key="ellipsis1" />);
      }
    }

    // Pages around current page
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);

    for (let page = start; page <= end; page++) {
      items.push(
        <BootstrapPagination.Item
          key={page}
          active={page === currentPage}
          onClick={() => onPageChange(page)}
        >
          {page}
        </BootstrapPagination.Item>
      );
    }

    // Last page
    if (currentPage < totalPages - 2) {
      if (currentPage < totalPages - 3) {
        items.push(<BootstrapPagination.Ellipsis key="ellipsis2" />);
      }
      items.push(
        <BootstrapPagination.Item
          key={totalPages}
          onClick={() => onPageChange(totalPages)}
        >
          {totalPages}
        </BootstrapPagination.Item>
      );
    }

    // Next button
    items.push(
      <BootstrapPagination.Next
        key="next"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      />
    );

    return items;
  };

  return (
    <div className="d-flex justify-content-center mt-4">
      <BootstrapPagination size="md">
        {renderPaginationItems()}
      </BootstrapPagination>
    </div>
  );
};

export default Pagination;
