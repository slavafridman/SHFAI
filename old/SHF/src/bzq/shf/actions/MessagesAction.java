/*
 * Created on 09/02/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.actions;

import java.io.IOException;
import java.util.Vector;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.apache.struts.action.ActionError;
import org.apache.struts.action.ActionErrors;
import org.apache.struts.action.ActionForm;
import org.apache.struts.action.ActionForward;
import org.apache.struts.action.ActionMapping;

import bzq.shf.dao.FactoryDao;
import bzq.shf.forms.MobileAuditRefForm;
import bzq.shf.model.MessageModel;
import bzq.shf.model.PlatformModel;
import bzq.shf.profile.UserProfile;
import bzq.shf.transfer.ReplaceMassage;
import bzq.shf.utils.AgentNotExistException;
import bzq.shf.utils.SHFConstants;
import bzq.shf.utils.SHFUtils;
import bzq.shf.utils.ShfException;
import bzq.shf.utils.TablesConstants;
import bzq.utils.AppResources;
import bzq.utils.TablesContainer;

/**
 * @author 03445956
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class MessagesAction extends BaseAction {

	/* (non-Javadoc)
	 * @see bzq.shf.actions.BaseAction#performAction(org.apache.struts.action.ActionMapping, org.apache.struts.action.ActionForm, javax.servlet.http.HttpServletRequest, javax.servlet.http.HttpServletResponse)
	 */
	public ActionForward performAction(
		ActionMapping mapping,
		ActionForm form,
		HttpServletRequest request,
		HttpServletResponse response)
		throws IOException, ServletException {
		
		ActionForward result=null;
		String param=(String)parameters.get("param");
		ReplaceMassage replaceMassage = null;
		
		if (form != null)	{		
			replaceMassage = (ReplaceMassage)form;			
		}
		if("showMessages".equals(param)){
			MessageModel messageModel = new MessageModel();									
			Vector messages = null;	    	        
			try{
				if (request.getSession().getAttribute("empId") == null)	{
					UserProfile userProfile = (UserProfile)request.getSession().getAttribute("userProfile");
					if (userProfile != null && userProfile.getEmployeeId() > 0 ) {
						request.getSession().setAttribute("empId",String.valueOf( userProfile.getEmployeeId()) );
					} else {
						request.getSession().setAttribute("empId",messageModel.getEmpId(replaceMassage.getUserId()));
					}
				}
				String str=(String)request.getSession().getAttribute("empId");
				if(str!=null)
				messages = messageModel.getAllMessage(str);			
				request.setAttribute("messages",messages);
				result=mapping.findForward("success");
			}catch(AgentNotExistException e){
				result=mapping.findForward("not_agent"); 	
			}catch(ShfException e){
				result=mapping.findForward("fail"); 	
			}  	
		}
		else if ("showMessages_icon".equals(param)) {
			
			request.setAttribute("newMessagesAmount","256");
			result=mapping.findForward("success");			
		}
		else if("deleteMessages".equals(param)){
			if (replaceMassage.getSelectedRows() == null ) {
				logger.error("delete messages failed because replaceMassage.getSelectedRows() returned NULL");
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
				saveErrors(request,actionErrors); 
				return result=mapping.findForward("success");
			}
			Vector<java.util.Map> paramMap = SHFUtils.urlToParamMap(replaceMassage.getSelectedRows());
			Vector<ReplaceMassage> selectedMsgs4del = new Vector<ReplaceMassage>();
			
			if (paramMap != null && paramMap.size() > 0) {
				try {
					SHFUtils.populateParamMap("bzq.shf.transfer.ReplaceMassage", selectedMsgs4del, paramMap);
				} catch (Exception e) {
					logger.error("delete messages failed while trying to populate from paramMap: "+e.getMessage());
					ActionErrors actionErrors = new ActionErrors();
					actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
					saveErrors(request,actionErrors); 
					return result = mapping.findForward("success");
				}
			}
			MessageModel messageModel = new MessageModel();
			try {
				messageModel.updateMessagesToDeleted(selectedMsgs4del);
			} catch (ShfException e) {
				saveErrors(request,e.getErrors());
			}
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.success.deleteSecceeded", null));
			saveErrors(request,actionErrors); 
			result=mapping.findForward("success");

		}
		else if("acceptOffer".equals(param)) {
			if (replaceMassage.getSelectedRows() == null ) {
				logger.error("accept offer failed because replaceMassage.getSelectedRows() returned NULL");
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
				saveErrors(request,actionErrors); 
				return result=mapping.findForward("success");
			}
			Vector<java.util.Map> paramMap = SHFUtils.urlToParamMap(replaceMassage.getSelectedRows());
			Vector<ReplaceMassage> replaceMessageVec = new Vector<ReplaceMassage>();
			try {
				SHFUtils.populateParamMap("bzq.shf.transfer.ReplaceMassage", replaceMessageVec, paramMap);
			} catch (Exception e) {
				logger.error("accept offer failed while trying to populate from paramMap: "+e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
				saveErrors(request,actionErrors); 
				return result = mapping.findForward("success");
			}
			if (replaceMessageVec.get(0).getMsgType() == null || ! FactoryDao.MSG_TYPE_OFFER_REPLACE.equals(replaceMessageVec.get(0).getMsgType()) ) {
				logger.error("accept offer failed because message type was not OFFER_REPLACE");
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.switchMessageNotOfferType", null));
				saveErrors(request,actionErrors); 
				return result = mapping.findForward("success");
			}
			
			MessageModel messageModel = new MessageModel();
			try {
				messageModel.setsCtx(getServlet().getServletContext());
				messageModel.acceptOffer(replaceMessageVec.get(0), request);
			} catch (ShfException e) {
				saveErrors(request,e.getErrors());
			}
			
			HttpSession session = request.getSession();
			UserProfile userProfile = (UserProfile) session.getAttribute("userProfile");
			if ("true".equals(session.getAttribute("isMobile"))) {
				
				TablesContainer tablesContainer = AppResources.getInstance().getTablesContainer();
				Vector<MobileAuditRefForm> mobileAuditRef = tablesContainer.getTable(TablesConstants.MOBILE_AUDIT_REF);
				String loginActionID = "";
				for (MobileAuditRefForm mobileAuditRefForm : mobileAuditRef) {
					if (SHFConstants.ACTION_OFFER_ACCEPT.equals( mobileAuditRefForm.getDescription())) {
						loginActionID = mobileAuditRefForm.getCode();
						if (loginActionID != null && loginActionID != "") {
							PlatformModel pm = new PlatformModel();
							try {
								pm.insertMobileAudit(userProfile.getId(), Integer.parseInt(loginActionID));
							} catch (ShfException e2) {
								logger.error("Error while inserting to MobileAudit table : " + e2.getMessage() );
							}
						}
					}
				}
			}
			
			result = mapping.findForward("success");
		}
		return result;
	}

}
