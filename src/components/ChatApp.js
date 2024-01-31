import React, { useState, useEffect, useRef } from "react";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
//import 'emoji-mart/css/emoji-mart.css';
import moment from "moment";
import io from "socket.io-client";
import "./chat.css";

const socket = io("http://localhost:5000");

const ChatApp = () => {
  const date = moment().format("MMMM-DD-YYYY");
  const time = moment().format("HH-mm-ss");
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  //console.log(selectedFile)

  const handleSendMessage = async () => {
    if (messageInput.trim() !== "" || selectedFile) {
      if (selectedFile) {
        try {
          const formData = new FormData();
          formData.append("file", selectedFile);

          const response = await fetch("http://localhost:5000/upload", {
            method: "POST",
            body: formData,
          });
          //console.log(response)

          if (response.ok) {
            const { filename } = await response.json();
            setMessages((prevMessages) => [
              ...prevMessages,
              { message: filename, sent: true, isFile: true },
            ]);

            socket.emit("file upload", filename);
          } else {
            console.error("File upload failed");
          }
        } catch (error) {
          console.error("Error uploading file:", error);
        }
      } else {
        setMessages((prevMessages) => [
          ...prevMessages,
          { message: messageInput, sent: true },
        ]);
        socket.emit("chat message", messageInput);
        setMessageInput("");
        setSelectedFile(null);
      }
    }
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  // console.log(files)

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      handleSendMessage();
    }
  };
  const handleEmojiSelect = (emoji) => {
    setMessageInput((prevMessage) => prevMessage + emoji.native);
    //console.log(emoji.native)
    setShowEmojiPicker(false);
  };

  const messageContainerRef = useRef(null);

  useEffect(() => {
    const messageContainer = messageContainerRef.current;
    messageContainer.scrollTop = messageContainer.scrollHeight;
  }, [messages]);

  useEffect(() => {
    socket.on("chat message", (msg) => {
      setMessages((prevMessages) => [
        ...prevMessages,
        { message: msg, sent: false, isFile: false },
      ]);
    });
    socket.on("file upload", (filename) => {
      setMessages((prevMessages) => [
        ...prevMessages,
        { message: filename, sent: false, isFile: true },
      ]);
    });

    // Clean up the socket connection
    // return () => {
    //     socket.disconnect();
    // };
  }, []);

  return (
    <div className="ChatApp">
      <img src={selectedFile} />
      <div className="MessageContainer" ref={messageContainerRef}>
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`ChatMessage ${msg.sent ? "right" : "left"}`}
          >
            <img src={selectedFile} />
            {msg.isFile ? (
              <div>
                <strong>{msg.sent ? "You" : "Sender"} sent a file:</strong>{" "}
                {
                  <a
                    href={`http://localhost:5000/uploads/${msg.message}`}
                    target="_blank"
                    //rel="noopener noreferrer"
                  >
                    {msg.message}
                  </a>
                }
              </div>
            ) : (
              <div className="">{msg.message}</div>
            )}
            <div className="DateTime">
              {date} {time}
            </div>
          </div>
        ))}
      </div>

      <div className="InputContainer">
        <input
          type="text"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          className="MessageInput"
          onKeyDown={handleKeyDown}
        />
        <input type="file" onChange={handleFileChange} />
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="EmojiButton"
        >
          😊
        </button>
        {showEmojiPicker && (
          <Picker data={data} onEmojiSelect={handleEmojiSelect} />
        )}
        <button onClick={handleSendMessage} className="SendButton">
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatApp;
