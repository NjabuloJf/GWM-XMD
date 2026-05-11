import moment from 'moment-timezone';
import config from '../config.cjs';

export default async function GroupParticipants(sock, { id, participants, action }) {
   try {
      const metadata = await sock.groupMetadata(id);
      
      // Get the person who performed this action (if available)
      // Note: Baileys doesn't directly provide the actor in participants update
      // We need to detect who caused the change
      
      // Process each participant in the event
      for (const jid of participants) {
         // Check if the affected user is an admin
         const participantInfo = metadata.participants.find(p => p.id === jid);
         const isParticipantAdmin = participantInfo?.admin === 'admin' || participantInfo?.admin === 'superadmin';
         
         // Get user info for better messaging
         let userInfo;
         try {
            userInfo = await sock.onWhatsApp(jid);
         } catch {
            userInfo = [{ exists: true, jid }];
         }
         
         const userName = userInfo[0]?.name || jid.split("@")[0];
         
         // GET THE ACTOR (who performed the action)
         // This requires additional event data from Baileys
         let actorJid = null;
         let isActorAdmin = false;
         
         try {
            // Attempt to get the actor from event context
            // You might need to capture this from the raw event
            if (global.lastGroupAction && global.lastGroupAction.groupId === id) {
               actorJid = global.lastGroupAction.actorJid;
               const actorInfo = metadata.participants.find(p => p.id === actorJid);
               isActorAdmin = actorInfo?.admin === 'admin' || actorInfo?.admin === 'superadmin';
            }
         } catch (err) {
            console.log("Could not determine actor:", err);
         }
         
         // SKIP if the affected user is an admin
         if (isParticipantAdmin) {
            console.log(`⏭️ Skipping ${action} for admin user ${userName} (admins are protected)`);
            continue;
         }
         
         // Handle different actions - ONLY for non-admin users
         switch (action) {
            case "add":
               // Only process if the person ADDING is NOT an admin
               if (isActorAdmin) {
                  console.log(`⏭️ Skipping add event for ${userName} because actor is admin`);
                  continue;
               }
               await handleUserAdd(sock, id, metadata, jid, userName);
               break;
               
            case "remove":
               // Only process if the person REMOVING is NOT an admin
               if (isActorAdmin) {
                  console.log(`⏭️ Skipping remove event for ${userName} because actor is admin`);
                  continue;
               }
               await handleUserRemove(sock, id, metadata, jid, userName);
               break;
               
            case "promote":
               // Only process if NON-ADMIN is being promoted
               await handleUserPromote(sock, id, metadata, jid, userName);
               break;
               
            case "demote":
               // Only process if NON-ADMIN is being demoted
               await handleUserDemote(sock, id, metadata, jid, userName);
               break;
               
            default:
               console.log(`Unknown action: ${action} for user ${userName}`);
         }
      }
      
   } catch (error) {
      console.error("❌ Error in GroupParticipants handler:", error);
      await handleError(sock, error, id);
   }
}

// ========== HELPER FUNCTIONS ==========

async function handleUserAdd(sock, groupId, metadata, jid, userName) {
   if (!config.WELCOME) return;
   
   // Get user's profile picture
   let profile;
   try {
      profile = await sock.profilePictureUrl(jid, "image");
   } catch {
      profile = "https://lh3.googleusercontent.com/proxy/esjjzRYoXlhgNYXqU8Gf_3lu6V-eONTnymkLzdwQ6F6z0MWAqIwIpqgq_lk4caRIZF_0Uqb5U8NWNrJcaeTuCjp7xZlpL48JDx-qzAXSTh00AVVqBoT7MJ0259pik9mnQ1LldFLfHZUGDGY=w1200-h630-p-k-no-nu";
   }
   
   const joinTime = moment.tz('Asia/Kolkata').format('HH:mm:ss');
   const joinDate = moment.tz('Asia/Kolkata').format('DD/MM/YYYY');
   const membersCount = metadata.participants.length;
   
   console.log(`✅ New non-admin user ${userName} joined ${metadata.subject}`);
   
   // Send welcome message
   await sock.sendMessage(groupId, {
      image: fs.readFileSync('./public/fanaa.jpg'), 
      caption: `*『GWM-XMD WELCOME』*
╭───━━━━━━━━━━━━━─
*│⿻╭───━━━──*
*│⿻├  Hello:* @${userName}! 
*│⿻├  You are the:* ${membersCount}th member 
*│⿻├  Joined at:* ${joinTime} on ${joinDate} 
*│⿻├  Welcome to: ${metadata.subject}* 
*│⿻╰──━━━───*
╰──━━━━━━━━━━━━─
▬▬▬▬▬▬▬▬▬▬
 *get started bot*
> gwmxmd.bot

*tech support*
> njabulojb.bot 
▬▬▬▬▬▬▬▬▬▬`, 
      contextInfo: {
         mentionedJid: [jid],
         isForwarded: true,
         forwardedNewsletterMessageInfo: {
            newsletterJid: config.ID_CHANNEL,
            newsletterName: "╭••➤GWM-XMD",
            serverMessageId: 143,
         },
         forwardingScore: 999,
         externalAdReply: {
            title: `👋 Welcome to ${metadata.subject}`,
            mediaType: 1,
            previewType: 0,
            renderLargerThumbnail: false,
            thumbnailUrl: profile,
            sourceUrl: 'https://gwm.com'
         }
      }
   });
   
   // Additional actions for new non-admin members
   await nonAdminActionsOnAdd(sock, groupId, metadata, jid, userName);
}

async function handleUserRemove(sock, groupId, metadata, jid, userName) {
   if (!config.WELCOME) return;
   
   // Get user's profile picture
   let profile;
   try {
      profile = await sock.profilePictureUrl(jid, "image");
   } catch {
      profile = "https://lh3.googleusercontent.com/proxy/esjjzRYoXlhgNYXqU8Gf_3lu6V-eONTnymkLzdwQ6F6z0MWAqIwIpqgq_lk4caRIZF_0Uqb5U8NWNrJcaeTuCjp7xZlpL48JDx-qzAXSTh00AVVqBoT7MJ0259pik9mnQ1LldFLfHZUGDGY=w1200-h630-p-k-no-nu";
   }
   
   const leaveTime = moment.tz('Asia/Kolkata').format('HH:mm:ss');
   const leaveDate = moment.tz('Asia/Kolkata').format('DD/MM/YYYY');
   const membersCount = metadata.participants.length;
   
   console.log(`👋 Non-admin user ${userName} left ${metadata.subject}`);
   
   // Send goodbye message
   await sock.sendMessage(groupId, {
      image: fs.readFileSync('./public/fanaa.jpg'), 
   caption: `*『GWM-XMD GOODBYE』*
╭───━━━━━━━━━━━━━─
*│⿻╭───━━━──*
*│⿻├  Goodbye @${userName} 
*│⿻├   from ${metadata.subject}  
*│⿻├  We are now ${membersCount} in the group. 
*│⿻├ Left at: ${leaveTime} on ${leaveDate}
*│⿻╰──━━━───*
╰──━━━━━━━━━━━━─
▬▬▬▬▬▬▬▬▬▬
 *get started bot*
> gwmxmd.bot

*tech support*
> njabulojb.bot 
▬▬▬▬▬▬▬▬▬▬
`, 
      contextInfo: {
         mentionedJid: [jid],
         isForwarded: true,
         forwardedNewsletterMessageInfo: {
            newsletterJid: config.ID_CHANNEL,
            newsletterName: "╭••➤GWM-XMD",
            serverMessageId: 143,
         },
         forwardingScore: 999,
         externalAdReply: {
            title: `👋 Goodbye`,
            mediaType: 1,
            previewType: 0,
            renderLargerThumbnail: true,
            thumbnailUrl: profile,
            sourceUrl: 'https://sid-bhai.vercel.app'
         }
      }
   });
         

   
   // Additional actions for non-admin members leaving
   await nonAdminActionsOnRemove(sock, groupId, metadata, jid, userName);
}

async function handleUserPromote(sock, groupId, metadata, jid, userName) {
   // Check if the user being promoted is currently not an admin
   const userInfo = metadata.participants.find(p => p.id === jid);
   const isBecomingAdmin = true; // They're being promoted
   
   const eventTime = moment.tz('Asia/Kolkata').format('HH:mm:ss');
   const eventDate = moment.tz('Asia/Kolkata').format('DD/MM/YYYY');
   
   console.log(`👑 ${userName} was promoted to admin in ${metadata.subject}`);
   
   // Send promotion notification for non-admin turned admin
   if (config.NOTIFY_ADMIN_CHANGES) {
      await sock.sendMessage(groupId, {
         text: `🎉 Congratulations @${userName}! You've been promoted to Admin.\nTime: ${eventTime} on ${eventDate}`,
         contextInfo: { mentionedJid: [jid] }
      });
   }
   
   // Log promotion
   if (config.ADMIN_LOG_GROUP) {
      await sock.sendMessage(config.ADMIN_LOG_GROUP, {
         text: `📋 ADMIN PROMOTION LOG\n\n• Group: ${metadata.subject}\n• User: ${userName}\n• Action: Promoted to Admin\n• Time: ${eventTime} ${eventDate}\n• Total Admins: ${metadata.participants.filter(p => p.admin).length}`
      });
   }
}

async function handleUserDemote(sock, groupId, metadata, jid, userName) {
   const eventTime = moment.tz('Asia/Kolkata').format('HH:mm:ss');
   const eventDate = moment.tz('Asia/Kolkata').format('DD/MM/YYYY');
   
   console.log(`📉 ${userName} was demoted from admin in ${metadata.subject}`);
   
   // Log demotion
   if (config.ADMIN_LOG_GROUP) {
      await sock.sendMessage(config.ADMIN_LOG_GROUP, {
         text: `📋 ADMIN DEMOTION LOG\n\n• Group: ${metadata.subject}\n• User: ${userName}\n• Action: Demoted from Admin\n• Time: ${eventTime} ${eventDate}\n• Total Admins: ${metadata.participants.filter(p => p.admin).length}`
      });
   }
}

// ========== NON-ADMIN SPECIFIC ACTIONS ==========

async function nonAdminActionsOnAdd(sock, groupId, metadata, jid, userName) {
   console.log(`⚙️ Performing actions for new non-admin user ${userName}`);
   
   // 1. Send welcome DM with rules (only for non-admins)
   if (config.SEND_RULES_DM) {
      try {
         await sock.sendMessage(jid, {
            text: `📜 *Group Rules for ${metadata.subject}*\n\n1. Be respectful to everyone\n2. No spam or advertisements\n3. Follow the group topic\n4. No NSFW content\n5. Respect admins and their decisions\n\nWelcome to the group!`
         });
      } catch (error) {
         console.log(`Cannot send DM to ${userName}: ${error.message}`);
      }
   }
   
   // 2. Log new non-admin member in admin channel
   if (config.ADMIN_LOG_GROUP) {
      const joinTime = moment.tz('Asia/Kolkata').format('HH:mm:ss DD/MM/YYYY');
      await sock.sendMessage(config.ADMIN_LOG_GROUP, {
         text: `🆕 NEW NON-ADMIN MEMBER\n\n• Group: ${metadata.subject}\n• User: ${userName}\n• Joined: ${joinTime}\n• Total Members: ${metadata.participants.length}`
      });
   }
   
   // 3. Auto-welcome in group (only for non-admins)
   if (config.AUTO_WELCOME_NON_ADMINS) {
      await sock.sendMessage(groupId, {
         text: `@${userName} welcome! Please read the group rules and enjoy your stay.`,
         contextInfo: { mentionedJid: [jid] }
      });
   }
   
   // 4. Check if user is suspicious (new account, no DP, etc.)
   if (config.CHECK_SUSPICIOUS_JOINS) {
      await checkSuspiciousUser(sock, groupId, metadata, jid, userName);
   }
}

async function nonAdminActionsOnRemove(sock, groupId, metadata, jid, userName) {
   console.log(`⚙️ Performing actions for removed non-admin user ${userName}`);
   
   // 1. Log non-admin member leave in admin channel
   if (config.ADMIN_LOG_GROUP) {
      const leaveTime = moment.tz('Asia/Kolkata').format('HH:mm:ss DD/MM/YYYY');
      await sock.sendMessage(config.ADMIN_LOG_GROUP, {
         text: `🚪 NON-ADMIN MEMBER LEFT\n\n• Group: ${metadata.subject}\n• User: ${userName}\n• Left: ${leaveTime}\n• Remaining Members: ${metadata.participants.length}`
      });
   }
   
   // 2. Cleanup user data
   if (config.CLEANUP_USER_DATA_ON_LEAVE) {
      console.log(`🧹 Cleaning up data for non-admin user ${userName}`);
      // Implement cleanup logic
   }
}

async function checkSuspiciousUser(sock, groupId, metadata, jid, userName) {
   // Check for suspicious patterns
   let isSuspicious = false;
   let reason = "";
   
   // Check if user has been in group before (join/leave spam)
   // This requires a database
   
   // Check account age (requires additional API)
   // Check if username is just numbers
   if (userName.match(/^\d+$/)) {
      isSuspicious = true;
      reason = "Username contains only numbers";
   }
   
   if (isSuspicious && config.ALERT_ON_SUSPICIOUS_JOIN) {
      await sock.sendMessage(config.ADMIN_LOG_GROUP, {
         text: `⚠️ SUSPICIOUS JOIN ALERT\n\n• User: ${userName}\n• Group: ${metadata.subject}\n• Reason: ${reason}\n• Time: ${moment().tz('Asia/Kolkata').format('HH:mm:ss DD/MM/YYYY')}`
      });
   }
}

async function handleError(sock, error, groupId) {
   console.error("❌ Group handler error:", error);
   
   // Send error to admin log
   if (config.ADMIN_LOG_GROUP) {
      try {
         await sock.sendMessage(config.ADMIN_LOG_GROUP, {
            text: `⚠️ ERROR IN GROUP HANDLER\n\nGroup: ${groupId}\nError: ${error.message}\nTime: ${moment().tz('Asia/Kolkata').format('HH:mm:ss DD/MM/YYYY')}`
         });
      } catch (logError) {
         console.error("Failed to send error log:", logError);
      }
   }
                              }
