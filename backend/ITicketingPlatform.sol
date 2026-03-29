// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;


interface ITicketingPlatform {
    // Max resale price for a ticket (facePrice * resaleCapBps / 10000).
    function getResaleCap(uint256 tokenId) external view returns (uint256);

    // Original face price paid for a ticket, in wei.
    function getTicketPrice(uint256 tokenId) external view returns (uint256);

    // True if ticket status is Valid AND the event is still Active.
    function isTicketValid(uint256 tokenId) external view returns (bool);
}
