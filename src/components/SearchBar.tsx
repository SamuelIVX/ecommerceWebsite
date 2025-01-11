"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

const SearchBar = () => {
  const router = useRouter(); // Using the `useRouter` hook to get access to Next.js's router for navigation.

  // Defining a function to handle the form submission event.
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Preventing the default form submission behavior (page refresh).
    const formData = new FormData(e.currentTarget); // Getting the form data from the submitted form.
    const name = formData.get("name") as string; // Extracting the value of the "name" field from the form data.

    // If the "name" value is not empty or null:
    if (name) {
      router.push(`/list?name=${name}`); // Navigating to the "/list" page and passing the "name" as a query parameter.
    }
  };

  return (
    <form
      className="flex items-center justify-between gap-4 bg-gray-100 p-2 rounded-md flex-1"
      onSubmit={handleSearch}
    >
      <input
        type="text"
        name="name"
        placeholder="Search"
        className="flex-1 bg-transparent outline-none"
      />
      <button className="cursor-pointer">
        <Image src="/search.png" alt="" width={16} height={16} />
      </button>
    </form>
  );
};

export default SearchBar;
