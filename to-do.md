1. First Verify the wa sms part , which is the part when we are trying to send a notification to the new user through wa and it during the first transfer(its the backend part).


13 Feb 2026
2. Seconed part is the check the flaws in the request moeny part and test the code for request moeny and build features on the top of that the this feature inclues: 
- request moeny url fix.
- issue : is how to keep the request link persisted for the if user haven't logged in 
- bug : we can't let run the request link for that same user (either reject or don't call anything after verifying)

Before This ( bcz bug arrived ): 
- resolved the EIP-7702 authorization issue (EOA upgrade to smart account ).
there was a private key for this but i think funds was not there. updated some backend code also with new format of delegation. 

Feature State: 
- I Basically resolved the issues in this feature and its working. 
- Just one thing i want is like after login it should redirect we are using that redirect payment url we are hitting webpage using that ( we have to store that request in localhost and after that it will hit after login idk i'll figure it out).