// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

interface IUniSwapV2Router02 {
    // Conozco la cantidad de tokens B que quiero obtener
    // No sé cuántos tokens A voy a pagar
    function swapTokensForExactTokens(
        uint amountOut,
        uint amountInMax,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
    function getReserves(address factory, address tokenA, address tokenB) external view returns (uint reserveA, uint reserveB);
    function getAmountIn(uint amountOut, uint reserveIn, uint reserveOut) external pure returns (uint amountIn);

}

interface IBBitesToken {
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 value) external returns(bool);
    function transferFrom(address from, address to, uint256 value) external returns(bool);
    function transfer(address to, uint256 amount) external returns (bool);
}

interface IUSDCoin {
    function approve(address spender, uint256 value) external returns(bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function transferFrom(address from, address to, uint256 value) external returns(bool);
}