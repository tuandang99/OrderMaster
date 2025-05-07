import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { ButtonProps, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

interface PaginationProps {
  className?: string;
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  className,
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const renderPageNumbers = () => {
    const pageNumbers = [];
    const maxVisibleButtons = 5;
    
    // Always show first page
    pageNumbers.push(
      <PaginationLink
        key={1}
        page={1}
        isActive={currentPage === 1}
        onClick={() => onPageChange(1)}
      />
    );

    if (totalPages <= maxVisibleButtons) {
      // If there aren't many pages, show all
      for (let i = 2; i < totalPages; i++) {
        pageNumbers.push(
          <PaginationLink
            key={i}
            page={i}
            isActive={currentPage === i}
            onClick={() => onPageChange(i)}
          />
        );
      }
    } else {
      // Show first page, current page, and some around current page
      if (currentPage > 3) {
        pageNumbers.push(<PaginationEllipsis key="ellipsis-1" />);
      }

      for (
        let i = Math.max(2, currentPage - 1);
        i <= Math.min(totalPages - 1, currentPage + 1);
        i++
      ) {
        pageNumbers.push(
          <PaginationLink
            key={i}
            page={i}
            isActive={currentPage === i}
            onClick={() => onPageChange(i)}
          />
        );
      }

      if (currentPage < totalPages - 2) {
        pageNumbers.push(<PaginationEllipsis key="ellipsis-2" />);
      }
    }

    // Always show last page unless it's the same as page 1
    if (totalPages > 1) {
      pageNumbers.push(
        <PaginationLink
          key={totalPages}
          page={totalPages}
          isActive={currentPage === totalPages}
          onClick={() => onPageChange(totalPages)}
        />
      );
    }

    return pageNumbers;
  };

  return (
    <nav
      role="navigation"
      aria-label="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
    >
      <ul className="flex flex-row items-center gap-1">
        <li>
          <PaginationPrevious
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          />
        </li>
        {renderPageNumbers()}
        <li>
          <PaginationNext
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
          />
        </li>
      </ul>
    </nav>
  );
}

interface PaginationLinkProps extends ButtonProps {
  isActive?: boolean;
  page: number;
}

function PaginationLink({
  className,
  isActive,
  page,
  onClick,
  ...props
}: PaginationLinkProps) {
  return (
    <button
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        buttonVariants({
          variant: isActive ? "outline" : "ghost",
          size: "icon",
        }),
        isActive && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
        className
      )}
      {...props}
    >
      {page}
    </button>
  );
}

function PaginationPrevious({
  className,
  onClick,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        buttonVariants({
          variant: "ghost",
          size: "icon",
        }),
        "gap-1 pl-2.5",
        className
      )}
      {...props}
    >
      <ChevronLeft className="h-4 w-4" />
      <span className="sr-only">Go to previous page</span>
    </button>
  );
}

function PaginationNext({
  className,
  onClick,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        buttonVariants({
          variant: "ghost",
          size: "icon",
        }),
        "gap-1 pr-2.5",
        className
      )}
      {...props}
    >
      <span className="sr-only">Go to next page</span>
      <ChevronRight className="h-4 w-4" />
    </button>
  );
}

function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      className={cn("flex h-9 w-9 items-center justify-center", className)}
      {...props}
    >
      <MoreHorizontal className="h-4 w-4" />
      <span className="sr-only">More pages</span>
    </span>
  );
}
