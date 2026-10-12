package bzq.shf.taglib;

import java.util.Vector;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;
import javax.servlet.jsp.JspException;
import javax.servlet.jsp.tagext.TagSupport;

import org.apache.log4j.Logger;
import org.apache.struts.util.ResponseUtils;

import bzq.db.DBAccess;
import bzq.db.DBException;
import bzq.db.DBQueryNoRowsException;
import bzq.shf.model.MessageModel;
import bzq.shf.profile.UserProfile;
import bzq.shf.transfer.ReplaceMassage;
import bzq.shf.utils.ShfException;

public class MessageIcon extends TagSupport {
	private static Logger logger = Logger.getLogger(MessageIcon.class);

	private static final long serialVersionUID = 1L;

	public int doStartTag() throws JspException {
		
		HttpServletRequest request = (HttpServletRequest) pageContext.getRequest();
		HttpSession session = request.getSession();
		String empId = (String)session.getAttribute("empId");
		String result = "";
		if ( empId == null || empId == "" ) {	
			UserProfile userProfile = (UserProfile)request.getSession().getAttribute("userProfile");
			if (userProfile != null && userProfile.getEmployeeId() > 0 ) {
				request.getSession().setAttribute("empId", String.valueOf( userProfile.getEmployeeId() ));
				empId = String.valueOf(userProfile.getEmployeeId());
			} else {
				try {
					MessageModel messageModel = new MessageModel();
					empId = messageModel.getEmpId(userProfile.getId());
					request.getSession().setAttribute("empId", empId);
				} catch (ShfException e) {
					logger.error("Error while retrieving employee id from DB : "+e.getMessage());
					logger.error("Unable to locate empId for current user, new messages counter will be skipped");
					ResponseUtils.write(pageContext, result);
					return (SKIP_BODY);
				}
			}
		}
		
		// get unread messages
		StringBuffer sql = new StringBuffer();
		sql.append("SELECT m.* FROM shifter.shf_replace_massage m ");
		sql.append("WHERE m.employee_id = ? ");
		sql.append("AND m.is_read = 0");
		sql.append("AND (m.is_deleted = 0 or m.is_deleted is null)");
		
		DBAccess dBAccess = null;
		Vector<ReplaceMassage> newMessages = null;
		try {
			dBAccess = new DBAccess();
			dBAccess.prepareStatement(sql.toString());
			dBAccess.setInt(1, Integer.parseInt(empId));
			dBAccess.executeQuery();
			newMessages = new Vector<ReplaceMassage>(); 
			dBAccess.populate("bzq.shf.transfer.ReplaceMassage", newMessages);
		} catch (DBQueryNoRowsException e) {
			logger.debug("(MessageIcon) No unread messages for emp id : " + empId);
		} catch (DBException e) {
			logger.error("DB error in MessageIcon : "+e.getMessage());
		} finally {
			try {
				dBAccess.close();
			} catch (DBException e) {
				logger.error("DB error in MessageIcon while dBAccess.close() : "+e.getMessage());
			}
		}
		
		if ( newMessages != null && newMessages.size() > 0 ) {
			result = "<td><span title=\"הודעות חדשות\" style=\"color: #ff0000; font-size: 85%; /*left: 76px; position: absolute;*/ \">("+(newMessages.size() > 999 ? "999+" : newMessages.size())+")</span></td>";
		}
		
		ResponseUtils.write(pageContext, result);
		return (SKIP_BODY);
	}
}
