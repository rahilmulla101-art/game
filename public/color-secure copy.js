/**
 * Color Game - Secure JWT-based Authentication
 * Uses cookies instead of query parameters for security
 */

// Function to extract cookie value (define BEFORE using it)
function getCookie(name) {
  const nameEQ = name + "=";
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.indexOf(nameEQ) === 0) {
      return decodeURIComponent(cookie.substring(nameEQ.length));
    }
  }
  return null;
}

document.addEventListener('DOMContentLoaded', function() {
  // ✅ SECURE: Get JWT from cookies (not query params)
  const token = localStorage.getItem('dvt_token');
  console.log("User ID from token:",token);

  
  if (!token) {
    alert('⚠️ Unauthorized: No authentication token found. Please login first.');
    window.location.href = '/index.html';
    return;
  }

  // Global variable to store user's wallet balance
  let userWalletBalance = 0;

  // Helper function to safely update wallet display (numbers only)
  function updateWalletDisplay(balance) {
    try {

      const walletElement = document.getElementById('wallet');
      if (walletElement) {
        walletElement.textContent = balance.toString();
      }
      userWalletBalance = balance;
      return balance;
    } catch (error) {
      console.error('Error updating wallet display:', error);
      const walletElement = document.getElementById('wallet');
      if (walletElement) {
        walletElement.textContent = '0';
      }
      userWalletBalance = 0;
      return 0;
    }
  }

  // Connect to the socket with token for authentication
  const socket = io('/color', {
    auth: {
      token: token
    }
  });

  // Function to handle betting
  function placeBet(side, amount) {
    console.log(`💰 Placing bet on ${side} with amount ₹${amount}`);
    socket.emit('placeBet', { colorOrNumber: side, amount: amount });
  }
    socket.emit('setUserId', token);

  // Emit authentication event with token
  socket.emit('authenticate', { token: token });

  // ✅ Listen for Bet Response
  socket.on('betResponse', function(response) {
    console.log(`📢 Bet Response:`, response.message);
    if (!response.success) {
      showNotification(`❌ ${response.message}`, 'error');
    } else {
      console.log(`✅ ${response.message}`);
    }
  });

  // ✅ Listen for Bet Placed Confirmation
  socket.on('betPlaced', function(data) {
    console.log(`🎯 Bet Placed On: ${data.color} | Amount: ₹${data.amount}`);
    showNotification(`🎯 Bet placed on ${data.color} for ₹${data.amount}!`, 'success');
  });

  // ✅ Listen for Room Stats (Active Players)
  socket.on('roomStats', function(stats) {
    console.log(`👥 Room Stats:`, stats);
    console.log(`   Active Players: ${stats.activePlayerCount}`);
    
    let currentUserWallet = null;
    stats.userList.forEach((user, idx) => {
      const walletBalance = user.walletBalance || 0;
      console.log(`   ${idx + 1}. ${user.username} (ID: ${user.userId}, Wallet: ₹${walletBalance})`);
      // Find current user in the list and update wallet if needed
      if (user.userId && userWalletBalance === 0 && walletBalance > 0) {
        currentUserWallet = walletBalance;
      }
    });
    
    // Update wallet if found and not already set
    if (currentUserWallet && userWalletBalance === 0) {
      updateWalletDisplay(currentUserWallet);
      console.log(`💰 Wallet auto-updated from roomStats: ₹${currentUserWallet}`);
    }
    
    // Update UI with player count
    const playerCountEl = document.getElementById('active_players');
    if (playerCountEl) {
      playerCountEl.textContent = `${stats.activePlayerCount} Players Online`;
    }
  });

  // ✅ Listen for User Joined Event
  socket.on('userJoined', function(data) {
    console.log(`🟢 User Joined: ${data.username} (ID: ${data.userId})`);
    console.log(`   Total Players Now: ${data.totalPlayersNow}`);
    
    // Show notification
    showNotification(`👋 ${data.username} joined the game!`, 'success');
  });

  // ✅ Listen for GameStateUpdate - to get initial wallet balance
  socket.on('gameStateUpdate', function(gameState) {
    console.log(`🎮 Game State Updated:`, gameState);
  });

  // ✅ Listen for User Left Event
  socket.on('userLeft', function(data) {
    console.log(`🔴 User Left: ${data.username} (ID: ${data.userId})`);
    console.log(`   Total Players Now: ${data.totalPlayersNow}`);
    
    // Show notification
    showNotification(`👋 ${data.username} left the game.`, 'info');
  });

  // ✅ CRITICAL: Listen for wallet updates after bet placement
  socket.on('updateWallet', function(balance) {
    console.log(`💰 Wallet Updated: ₹${balance}`);
    updateWalletDisplay(balance);
    showNotification(`💰 Wallet updated: ₹${balance}`, 'success');
  });

  // Helper function to show notifications
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    let bgColor = '#2196f3'; // default info
    if (type === 'success') bgColor = '#4caf50';
    if (type === 'error') bgColor = '#f44336';
    
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background-color: ${bgColor};
      color: white;
      padding: 15px 20px;
      border-radius: 4px;
      z-index: 9999;
      font-weight: bold;
      animation: slideIn 0.3s ease-in;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // Listen for gameResultsArray from server
  socket.on('gameResultsArray', function(data) {
    const gameResults = data.gameResults; // Access the array correctly
    console.log('Game Results Array:', gameResults);
    
    // Check if gameResults is an array
    if (!Array.isArray(gameResults)) {
        console.error('Expected gameResults to be an array, but got:', gameResults);
        return;
    }

    // Process and display the results
    gameResults.forEach((result, index) => {
        console.log(`Result ${index + 1}:`);
        console.log(`  Period: ${result.period}`);
        console.log(`  User ID: ${result.userId}`);
        console.log(`  Bet: ${result.bet}`);
        console.log(`  Amount: ${result.amount}`);
        console.log('---');

        // Create new elements for each result
        const wrapper = document.createElement('div');
        wrapper.className = 'frame-wrapper41';
        
        const innerDiv = document.createElement('div');
        innerDiv.className = 'frame-parent96';
        
        const periodDiv = document.createElement('div');
        periodDiv.className = 'points-frame';
        periodDiv.innerHTML = `<b class="points2">${result.period}</b>`;
        
        const userIdDiv = document.createElement('div');
        userIdDiv.className = 'side-container';
        userIdDiv.innerHTML = `<b class="points2">******${result.userId.toString().slice(-3)}</b>`;
        
        const betDiv = document.createElement('div');
        betDiv.className = 'frame-wrapper42';
        
        // Check if bet is a number (0-9) or a color string
        const betValue = result.bet;
        let betContent = '';
        
        // Check if it's a number (0-9)
        if (!isNaN(betValue) && betValue >= 0 && betValue <= 9) {
          // Number bet - show coin image
          const coinImages = {
            0: './public/frame-313@2x.png',
            1: './public/frame-3131@2x.png',
            2: './public/frame-3132@2x.png',
            3: './public/frame-3133@2x.png',
            4: './public/frame-3134@2x.png',
            5: './public/frame-3135@2x.png',
            6: './public/frame-3136@2x.png',
            7: './public/frame-3137@2x.png',
            8: './public/frame-3138@2x.png',
            9: './public/frame-3139@2x.png'
          };
          const coinImage = coinImages[betValue] || './public/frame-31310@2x.png';
          betContent = `<img class="frame-child37" alt="Number ${betValue}" src="${coinImage}" />`;
        } else {
          // Color bet - show colored div/circle
          let bgColor = '#808080'; // default gray
          let colorLabel = betValue.toUpperCase();
          
          if (betValue.toLowerCase() === 'red') {
            bgColor = '#ff0000'; // Red
          } else if (betValue.toLowerCase() === 'green') {
            bgColor = '#00bb00'; // Green
          } else if (betValue.toLowerCase() === 'violet') {
            bgColor = '#9900ff'; // Violet/Purple
          }
          
          betContent = `
            <div style="
              width: 20px;
              height: 20px;
              background-color: ${bgColor};
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              font-size: 10px;
              border: 2px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            ">${colorLabel.charAt(0)}</div>
          `;
        }
        
        betDiv.innerHTML = betContent;
        const amountDiv = document.createElement('div');
        amountDiv.className = 'side-container';
        amountDiv.innerHTML = `<b class="b5">₹${result.amount}</b>`;
        
        innerDiv.appendChild(periodDiv);
        innerDiv.appendChild(userIdDiv);
        innerDiv.appendChild(betDiv);
        innerDiv.appendChild(amountDiv);
        
        wrapper.appendChild(innerDiv);
        
        // Append the new elements to the previous result container
        document.getElementById('prevous result').appendChild(wrapper);
    });
});

  // Event listeners for betting buttons
  document.getElementById('green_bet_button').addEventListener('click', function() {
    const betAmount = 100; // Default bet amount, you can modify this as needed
    // placeBet('green', betAmount);
  });
  // Listen for win result from server
  socket.on('winResult', function(data) {
    // Clear the previous results
    
    console.log('Win Result:', data);
    const { number, color, betAmount, winnings } = data;
    if (typeof number === 'number') {
        console.log(`You won ${winnings} on number ${number}! (Bet amount: ${betAmount})`);
    } else {
        console.log(`You won ${winnings} on color ${color}! (Bet amount: ${betAmount})`);
    }
    document.getElementById('winn_amount').textContent = winnings;
    if (typeof number === 'number') {
        document.getElementById('win_infor').textContent = `Number ${number}`;
    } else {
        document.getElementById('win_infor').textContent = `Color ${color.toUpperCase()}`;
    }

    setTimeout(() => {
      const winElement = document.getElementById('win');
      winElement.style.display = 'flex';
      winElement.style.animation = 'slideUp 0.5s ease-out';
      
      // Add this CSS to your stylesheet if not already present:
      // @keyframes slideUp {
      //   from { transform: translateY(100%); opacity: 0; }
      //   to { transform: translateY(0); opacity: 1; }
      // }
      setTimeout(() => {
        document.getElementById('win').style.display = 'none';
      }, 4000);
    }, 4000);
    // Hide the win message after 2 seconds
 
    // You can add more UI updates here to display the win result to the user
  });
  // Listen for bet placed confirmation from server
  socket.on('betPlaced', function(data) {
    console.log('Bet placed:', data);
    const { color, amount } = data;
    
    // Update UI to reflect the placed bet'
    const betDiv = document.getElementById('bet_placed');
    if (betDiv) {
      betDiv.style.display = 'flex';
      const conformTypeElement = betDiv.querySelector('#conform_type');
      const conformAmountElement = betDiv.querySelector('#conform_amount');
      if (conformTypeElement && conformAmountElement) {
        conformTypeElement.textContent = color;
        conformAmountElement.textContent = "Rs. " + amount;
      }

    } else {
      console.warn(`Bet div for ${color} not found in the DOM`);
    }
    // Hide the bet confirmation after 2 seconds
    setTimeout(() => {
      if (betDiv) {
        betDiv.style.display = 'none';
      }
    }, 2000);

    // You can add more UI updates here, such as:
    // - Disabling bet buttons
    // - Showing a confirmation message
    // - Updating total bet amount, if applicable
  });
  // Listen for time updates from server
  socket.on('timeUpdate', function(data) {
    // colorNamespace.emit('timeUpdate', { timeRemaining:, round: colorGameState.round });
    const timeRemaining = data.timeRemaining;
    const round = data.round;
    console.log('Time remaining:', timeRemaining);
    
    console.log('Round:', round);
    // Update the timer display in the UI
    const timerElement = document.getElementById('count_down');
    if (timerElement) {
      // Ensure the timer element is visible
      timerElement.style.display = 'flex';
      
      // Calculate minutes and seconds
      const minutes = Math.floor(timeRemaining / 60);
      const seconds = timeRemaining % 60;
      
      // Update the timer display
      timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      
      // Update the round display
      const roundElement = document.getElementById('round');
      if (roundElement) {
        roundElement.textContent = round;
      }
    
    } else {
      console.warn('Timer element not found in the DOM');
    }
  });

  // Listen for bet response from server
  socket.on('betResponse', function(response) {
    console.log('Bet Response:', response);
    // You can handle the response here, e.g., update UI, show messages, etc.
  });
  // Listen for wallet updates from server
  socket.on('updateWallet', function(newBalance) {
    try {
      console.log(`💰 Wallet updated: ₹${newBalance}`);
      const updated = updateWalletDisplay(newBalance);
      console.log(`✅ Wallet display updated to: ₹${updated}`);
    } catch (error) {
      console.error('Error in wallet update handler:', error);
      updateWalletDisplay(0);
    }
  });
  // Event listener for green_bet_button
  document.getElementById('green_bet_button').addEventListener('click', function() {
    // Change display of bet_red div to flex
    const betRedDiv = document.getElementById('bet_green_div');
    if (betRedDiv) {
      betRedDiv.style.display = 'flex';
    } else {
      console.warn('bet_red element not found in the DOM');
    }
  });
  document.getElementById('violet_bet_button').addEventListener('click', function() {
    // Change display of bet_red div to flex
    const betRedDiv = document.getElementById('violet');
    if (betRedDiv) {
      betRedDiv.style.display = 'flex';
    } else {
      console.warn('bet_red element not found in the DOM');
    }
  });
  // Event listener for cancel_red
  document.getElementById('cancel_red').addEventListener('click', function() {
    const betRedDiv = document.getElementById('bet_red_div');
    if (betRedDiv) {
      betRedDiv.style.display = 'none';
    } else {
      console.warn('bet_red_div element not found in the DOM');
    }
  });
  // Event listener for red_fifty
  // Event listeners for red bets
  document.getElementById('red_fifty').addEventListener('click', function() {
    placeBet('red', 50);
  });

  document.getElementById('red_hundered').addEventListener('click', function() {
    placeBet('red', 100);
  });

  document.getElementById('red_fivehundered').addEventListener('click', function() {
    placeBet('red', 500);
  });

  document.getElementById('red_thousand').addEventListener('click', function() {
    placeBet('red', 1000);
  });

  // Event listeners for green bets
  document.getElementById('green_fifty').addEventListener('click', function() {
    placeBet('green', 50);
  });

  document.getElementById('green_hundered').addEventListener('click', function() {
    placeBet('green', 100);
  });

  document.getElementById('green_fivehundered').addEventListener('click', function() {
    placeBet('green', 500);
  });

  document.getElementById('green_thousand').addEventListener('click', function() {
    placeBet('green', 1000);
  });

  // Event listeners for violet bets
  document.getElementById('violet_fifty').addEventListener('click', function() {
    placeBet('violet', 50);
  });

  document.getElementById('violet_hundered').addEventListener('click', function() {
    placeBet('violet', 100);
  });

  document.getElementById('violet_fivehundered').addEventListener('click', function() {
    placeBet('violet', 500);
  });

  document.getElementById('violet_thousand').addEventListener('click', function() {
    placeBet('violet', 1000);
  });
  // Listen for wheelSpinning event from the server
  socket.on('wheelSpinning', function(data) {
    console.log('Wheel is spinning:', data);
    // Show the countdown remaining element
    const countDownRemaining = document.getElementById('count_down_remianing');
    // Create a countdown from 3 seconds
    let countdown = 2;
    const countdownInterval = setInterval(() => {
      const countDownData = document.getElementById('count_down_data');
      if (countDownData) {
        countDownData.textContent = countdown;
        countdown--;
        
        if (countdown < 0) {
          clearInterval(countdownInterval);
          countDownData.textContent = '0';
          countDownRemaining.style.display = 'none';
        }
        if (countdown === 0) {
          if (countDownRemaining) {
          
          } else {
            console.warn('count_down_remianing element not found in the DOM');
          }
        }
      } else {
        console.warn('count_down_data element not found in the DOM');
        clearInterval(countdownInterval);
      }
    }, 1000);
    if (countDownRemaining) {
    
        countDownRemaining.style.display = 'flex';
     
    } else {
      console.warn('count_down_remianing element not found in the DOM');
    }
    // You might want to update the UI to show that the wheel is spinning
    // For example, disable betting buttons or show a spinning animation
    // const bettingButtons = document.querySelectorAll('.betting-button');
    // bettingButtons.forEach(button => {
    //   button.disabled = true;
    // });

    // // You could also display a message to the user
    // const statusMessage = document.getElementById('status-message');
    // if (statusMessage) {
    //   statusMessage.textContent = 'Wheel is spinning! Bets are closed.';
    // }

    // If you have a wheel animation, you could start it here
    // startWheelAnimation();
  });
  // Listen for gameResult event from the server
  socket.on('numberArray', function(numberArray) {
    const waitingMessage = document.querySelector('.parent20');
    if (waitingMessage) {
      waitingMessage.style.display = 'none';
    } else {
      console.warn('parent20 element not found in the DOM');
    }
    console.log('Number Array:', numberArray);
  // Update the previous results display
  const previousResultsContainer = document.getElementById('previous_results');
  if (previousResultsContainer) {
    // Clear existing content
    previousResultsContainer.innerHTML = '';
    
    // Iterate through the numberArray in reverse order
    for (let i = numberArray.length - 1; i >= 0 && i > numberArray.length - 11; i--) {
      const newResultImg = document.createElement('img');
      newResultImg.className = 'frame-child11';
      
      // Set the source based on the number in the array
      switch (numberArray[i]) {
        case 0:
          newResultImg.src = './public/frame-313@2x.png';
          break;
        case 1:
          newResultImg.src = './public/frame-3131@2x.png';
          break;
        case 2:
          newResultImg.src = './public/frame-3132@2x.png';
          break;
        case 3:
          newResultImg.src = './public/frame-3133@2x.png';
          break;
        case 4:
          newResultImg.src = './public/frame-3134@2x.png';
          break;
        case 5:
          newResultImg.src = './public/frame-3135@2x.png';
          break;
        case 6:
          newResultImg.src = './public/frame-3136@2x.png';
          break;
        case 7:
          newResultImg.src = './public/frame-3137@2x.png';
          break;
        case 8:
          newResultImg.src = './public/frame-3138@2x.png';
          break;
        case 9:
          newResultImg.src = './public/frame-3139@2x.png';
          break;
        default:
          console.warn('Unexpected result:', numberArray[i]);
          continue;
      }

      // Append the new result to the container
      previousResultsContainer.appendChild(newResultImg);
      // Apply special styling to the last image
      if (i === numberArray.length - 1) {
        // Create a flex container
        const flexContainer = document.createElement('div');
        flexContainer.style.display = 'flex';
        flexContainer.style.flexDirection = 'column';
        flexContainer.style.alignItems = 'center';
        
        flexContainer.style.borderRadius = '6px'; // Make it round
        flexContainer.style.overflow = 'hidden'; // Ensure content doesn't overflow the circular shape
        flexContainer.style.padding = '1px';
        // Adjust this value as needed for the desired negative gap
        
      
        // Append text to indicate recent win
        const recentWinText = document.createElement('span');
        recentWinText.textContent = 'Recent Win';
        recentWinText.style.color = 'rgb(192 14 106)'; // Black text color
        recentWinText.style.backgroundColor = '#FFFF00'; // Yellow color
        recentWinText.style.paddingLeft = '5px';
        recentWinText.style.paddingRight = '5px';
        recentWinText.style.borderRadius = '4px'; // Add border radius to the text element
        recentWinText.style.fontWeight = 'bold';
        recentWinText.style.marginBottom = '1px';
        recentWinText.style.fontSize = '8px'; // Adjust this value as needed
        // Append the text and image to the flex container
       
        flexContainer.appendChild(newResultImg.cloneNode(true));
        flexContainer.appendChild(recentWinText);
        // Replace the original image with the flex container
        const parentElement = newResultImg.parentElement;
        parentElement.replaceChild(flexContainer, newResultImg);
      
        const mainCoin = document.getElementById('main_coin');
        const mainCoin2 = document.getElementById('main_coin2');
        if (mainCoin && mainCoin2) {
          mainCoin.src = newResultImg.src;
          mainCoin2.src = newResultImg.src;
        } else {
          console.warn('main_coin or main_coin2 element not found in the DOM');
        }
      }
    }
  } else {
    console.warn('previous_results container not found in the DOM');
  }
  });
  socket.on('gameResult', function(result) {
    // Add rotation animation to the coin
    const rotatingCube = document.querySelector('.rotating-cube');
    if (rotatingCube) {
      rotatingCube.style.animation = 'rotate 1s linear infinite, ease-out 2s';
      const previousResultsContainer = document.getElementById('prevous result');
    if (previousResultsContainer) {
      previousResultsContainer.innerHTML = '';
    } else {
      console.warn('Previous results container not found in the DOM');
    }
      // Stop the animation after 1 second
      setTimeout(() => {
        rotatingCube.style.animation = 'none';
      }, 3000);
    } else {
      console.warn('rotating-cube element not found in the DOM');
    }

    console.log('Game Result:', result);
    const mainCoin = document.getElementById('main_coin');
    const mainCoin2 = document.getElementById('main_coin2');
    if (mainCoin) {
      switch (result) {
        case 0:
          mainCoin.src = './public/frame-313@2x.png';
          mainCoin2.src = './public/frame-313@2x.png';
          break;
        case 1:
          mainCoin.src = './public/frame-3131@2x.png';
          mainCoin2.src = './public/frame-3131@2x.png';
          break;
        case 2:
          mainCoin.src = './public/frame-3132@2x.png';
          mainCoin2.src = './public/frame-3132@2x.png';
          break;
        case 3:
          mainCoin.src = './public/frame-3133@2x.png';
          mainCoin2.src = './public/frame-3133@2x.png';
          break;
        case 4:
          mainCoin.src = './public/frame-3134@2x.png';
          mainCoin2.src = './public/frame-3134@2x.png';
          break;
        case 5:
          mainCoin.src = './public/frame-3135@2x.png';
          mainCoin2.src = './public/frame-3135@2x.png';
          break;
        case 6:
          mainCoin.src = './public/frame-3136@2x.png';
          mainCoin2.src = './public/frame-3136@2x.png';
          break;
        case 7:
          mainCoin.src = './public/frame-3137@2x.png';
          mainCoin2.src = './public/frame-3137@2x.png';
          break;
        case 8:
          mainCoin.src = './public/frame-3138@2x.png';
          mainCoin2.src = './public/frame-3138@2x.png';
          break;
        case 9:
          mainCoin.src = './public/frame-3139@2x.png';
          mainCoin2.src = './public/frame-3139@2x.png'; 
          break;
        default:
          console.warn('Unexpected result:', result);

      }
    } else {
      console.warn('main_coin element not found in the DOM');
    }
  });
  // Event listeners for number bets (0-9)
  let selectedNumber = null;
  
  for (let i = 0; i <= 9; i++) {
    document.getElementById(i.toString()).addEventListener('click', function() {
      selectedNumber = i;
      // Show the number betting panel
      const numberBetDiv = document.getElementById('number_bet_div');
      if (numberBetDiv) {
        const selectedNumberElement = document.getElementById('selected_number');
        if (selectedNumberElement) {
          selectedNumberElement.textContent = i;
        }
        numberBetDiv.style.display = 'flex';
        console.log(`🎰 Number ${i} selected. Showing bet options.`);
      } else {
        console.warn('number_bet_div element not found in the DOM');
      }
    });
  }

  // Event listeners for number bet amounts
  document.getElementById('number_fifty').addEventListener('click', function() {
    if (selectedNumber !== null) {
      placeBet(selectedNumber.toString(), 50);
    }
  });

  document.getElementById('number_hundered').addEventListener('click', function() {
    if (selectedNumber !== null) {
      placeBet(selectedNumber.toString(), 100);
    }
  });

  document.getElementById('number_fivehundered').addEventListener('click', function() {
    if (selectedNumber !== null) {
      placeBet(selectedNumber.toString(), 500);
    }
  });

  document.getElementById('number_thousand').addEventListener('click', function() {
    if (selectedNumber !== null) {
      placeBet(selectedNumber.toString(), 1000);
    }
  });

  // Cancel number bet
  document.getElementById('cancel_number').addEventListener('click', function() {
    const numberBetDiv = document.getElementById('number_bet_div');
    if (numberBetDiv) {
      numberBetDiv.style.display = 'none';
    } else {
      console.warn('number_bet_div element not found in the DOM');
    }
  });

  // Update placeBet function to handle number bets
  function placeBet(colorOrNumber, amount) {
    console.log(`Placing bet: ₹${amount} on ${colorOrNumber}`);
    console.log(`Current Wallet Balance: ₹${userWalletBalance}`);
    // Emit a socket event to place the bet
    socket.emit('placeBet', { colorOrNumber: colorOrNumber, amount: amount });
  }

  // Event listener for cancel_green
  document.getElementById('cancel_green').addEventListener('click', function() {
    const betGreenDiv = document.getElementById('bet_green_div');
    if (betGreenDiv) {
      betGreenDiv.style.display = 'none';
    } else {
      console.warn('bet_green_div element not found in the DOM');
    }
  });

  // Event listener for cancel_voilet
  document.getElementById('cancel_voilet').addEventListener('click', function() {
    const violetDiv = document.getElementById('violet');
    if (violetDiv) {
      violetDiv.style.display = 'none';
    } else {
      console.warn('violet element not found in the DOM');
    }
  });
  document.getElementById('red_bet_button').addEventListener('click', function() {
    // Change display of bet_red div to flex
    const betRedDiv = document.getElementById('bet_red_div');
    if (betRedDiv) {
      betRedDiv.style.display = 'flex';
    } else {
      console.warn('bet_red element not found in the DOM');
    }
  });

  // Back button functionality - redirect to dashboard (secure)
  document.getElementById('Back').addEventListener('click', function() {
    window.location.href = '/game.html';
  });

  // Handle auth errors
  socket.on('auth_error', function(data) {
    console.error('Authentication error:', data.message);
    alert('❌ ' + data.message);
    window.location.href = '/index.html';
  });

  // Handle connection errors
  socket.on('connect_error', function(error) {
    console.error('Connection error:', error);
  });
});
