/*
 * Created on 15/03/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.actions;

import java.io.IOException;
import java.util.HashMap;
import java.util.Vector;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.apache.log4j.Logger;
import org.apache.struts.action.ActionForm;
import org.apache.struts.action.ActionForward;
import org.apache.struts.action.ActionMapping;

import bzq.shf.bean.AgentDayBean;
import bzq.shf.bean.ForecastSchedualBean;
import bzq.shf.forms.ActivityCallsForm;
import bzq.shf.forms.ForecastForm;
import bzq.shf.model.ForecastModel;
import bzq.shf.utils.SHFTableUtils;
import bzq.shf.utils.ShfException;

/**
 * @author 04982497
 * 
 *         To change the template for this generated type comment go to
 *         Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class ForecastAction extends BaseAction {

	private Logger logger = Logger.getLogger(ForecastAction.class);

	public ActionForward performAction(ActionMapping mapping, ActionForm form,
			HttpServletRequest request, HttpServletResponse response)
			throws IOException, ServletException {
		ActionForward result = null;
		String param = (String) parameters.get("param");

		if (param.equals("param")) {
			result = mapping.findForward("success");
		}

		// ////////////////////////////////////////
		// /////////////// calls //////////////////
		// ////////////////////////////////////////

		if (param.equals("call_param")) {
			try {
				// Yuval - original code
				// ForecastForm forecastForm=(ForecastForm)form;
				// ForecastModel forecast=new ForecastModel(forecastForm);
				// forecast.setDefault();
				// result=mapping.findForward("success");

				// Yuval changed code

				ForecastModel forecastMDL = null;
				ForecastForm forecastForm = (ForecastForm) form;
				ForecastForm storedForecastForm = (ForecastForm) request
						.getSession().getAttribute("forecastCallForm");

				if (storedForecastForm == null) {
					forecastMDL = new ForecastModel(forecastForm);
					forecastMDL.setDefault();
				} else {
					((ForecastForm) forecastForm).copyForm(storedForecastForm);
				}

				result = mapping.findForward("success");

			} catch (ShfException e) {
				int i = 1;
				if (i == 1)
					i = 1;
			}
		}

		else if (param.equals("call_populate")) {
			ForecastForm forecastForm = (ForecastForm) form;

			// Yuval
			// get parameter to session
			request.getSession().setAttribute("forecastCallForm", forecastForm);
			ForecastModel forecastMDL = new ForecastModel(forecastForm);
			try {
				Vector<ActivityCallsForm> localMokeds = null;
////////////////// Igal 5.2013
				if ("moked".equals(forecastForm.getRbChoice())) { // if radio button is local activity
					// then get all the activities IDs to localMokeds
					forecastMDL.setActivityForSelect();			
					String localAct = forecastForm.getActivitiesForSelect();
					forecastForm.setLocalActArr(localAct.split(","));
					localMokeds = forecastMDL.populateLocalActivities(forecastForm.getLocalActArr());
				} else {
//////////////////////////////// get all the actual activities for virtual
					localMokeds = forecastMDL.populateLocalActivities(forecastForm.getVirtualActivity());					
				  }
				
				request.setAttribute("localMokeds", localMokeds);

				HashMap map = forecastMDL.populateCallForecast();
				if (map != null && map.size() > 0) {
					forecastMDL.populateLocalActivities(localMokeds, map);
					Vector v = forecastMDL.sumData(localMokeds, map);
					request.setAttribute("forecastData", v);
				}
			} catch (ShfException e) {
				saveErrors(request, e.getErrors());
			}

			request.setAttribute("forecastForm", forecastForm);
			result = mapping.findForward("success");
		}

		// ////////////////////////////////////////
		// ///////////// schedule /////////////////
		// ////////////////////////////////////////

		else if (param.equals("sch_param")) {
			try {
				ForecastModel forecast = null;
				ForecastForm forecastForm = (ForecastForm) form;
				ForecastForm storedForecastForm = (ForecastForm) request
						.getSession().getAttribute("forecastForm");
				// --shiftsForm=(ShiftDataForm)form;
				// --ShiftDataForm storedShiftsForm =
				// (ShiftDataForm)request.getSession().getAttribute("shiftsForm");
				if (storedForecastForm == null) {
					forecast = new ForecastModel(forecastForm);
					forecast.setDefault();
				} else {
					((ForecastForm) forecastForm).copyForm(storedForecastForm);
				}

				// ForecastModel forecast=new ForecastModel(forecastForm);
				// forecast.setDefault();
				result = mapping.findForward("success");
			} catch (ShfException e) {

			}
		}

		else if (param.equals("sch_populate")) {
			try {
				ForecastForm forecastForm = (ForecastForm) form;
				// get parameter to session
				request.getSession().setAttribute("forecastForm", forecastForm);

				ForecastModel forecastMDL = new ForecastModel(forecastForm);
				if (forecastForm.getVirtualActivity() != null
						&& forecastForm.getActivityList() != null
						&& forecastForm.getExceptionList() != null) {
					if (forecastForm.getRbChoice().equals("activity")) { // if
																			// Radio
																			// Button
																			// is
																			// "תור ארצי"
						forecastMDL.setActivityFromVirtual(); //then get all the local activities id for that virtual
					}
					if (forecastForm.getRbChoice().equals("moked")) {
						forecastMDL.setActivityForSelect();
						forecastMDL.setExceptionForSelect();
					}
					if (( forecastForm.getActivitiesForSelect() != null && forecastForm.getActivitiesForSelect().length() > 0)
						|| (forecastForm.getExceptionsForSelect() != null && forecastForm.getExceptionsForSelect().length() > 0)) {
						Vector data = forecastMDL.populateSchedualForecast();
						
						Vector masterData = forecastMDL.sumSchData(data);
						request.setAttribute("forecastData", masterData);
						request.getSession().setAttribute("forecastData",
								masterData);
					}
				}
				request.setAttribute("forecastForm", forecastForm);

				// request.getSession().setAttribute("forecastForm",forecastForm);
				result = mapping.findForward("success");

			} catch (ShfException e) {

			}
		} else if (param.equals("marked_agents")) {
			ForecastForm forecastForm = (ForecastForm) form;
			Vector masterData = new Vector();
			masterData = (Vector) request.getSession().getAttribute(
					"forecastData");
			if (masterData != null) {
				ForecastSchedualBean forecastSchedualBean = (ForecastSchedualBean) masterData
						.get(forecastForm.getIndexForSearch());
				Vector markedAgent = new Vector();
				markedAgent = forecastSchedualBean.getMarkedDetails();
				request.setAttribute("agentDayBeans", markedAgent);
			}

			result = mapping.findForward("success");
		} else if (param.equals("late_agents")) {
			ForecastForm forecastForm = (ForecastForm) form;
			Vector masterData = new Vector();
			masterData = (Vector) request.getSession().getAttribute(
					"forecastData");
			if (masterData != null) {
				ForecastSchedualBean forecastSchedualBean = (ForecastSchedualBean) masterData
						.get(forecastForm.getIndexForSearch());
				Vector lateAgent = new Vector();
				lateAgent = forecastSchedualBean.getLateDetails();
				request.setAttribute("agentDayBeans", lateAgent);
			}

			result = mapping.findForward("success");
		} else if (param.equals("missing_agents")) {
			ForecastForm forecastForm = (ForecastForm) form;
			Vector masterData = new Vector();
			masterData = (Vector) request.getSession().getAttribute(
					"forecastData");
			if (masterData != null) {
				ForecastSchedualBean forecastSchedualBean = (ForecastSchedualBean) masterData
						.get(forecastForm.getIndexForSearch());
				Vector missingAgent = new Vector();
				missingAgent = forecastSchedualBean.getMissingDetails();
				request.setAttribute("agentDayBeans", missingAgent);
			}

			result = mapping.findForward("success");
		} else if (param.equals("future_agents")) {
			ForecastForm forecastForm = (ForecastForm) form;
			Vector masterData = new Vector();
			masterData = (Vector) request.getSession().getAttribute(
					"forecastData");
			if (masterData != null) {
				ForecastSchedualBean forecastSchedualBean = (ForecastSchedualBean) masterData
						.get(forecastForm.getIndexForSearch());
				Vector futureAgent = new Vector();
				futureAgent = forecastSchedualBean.getFutureExitDetails();
				request.setAttribute("agentDayBeans", futureAgent);
			}

			result = mapping.findForward("success");
		} else if (param.equals("arrival_agents")) {
			ForecastForm forecastForm = (ForecastForm) form;
			Vector masterData = new Vector();
			masterData = (Vector) request.getSession().getAttribute(
					"forecastData");
			if (masterData != null) {
				ForecastSchedualBean forecastSchedualBean = (ForecastSchedualBean) masterData
						.get(forecastForm.getIndexForSearch());
				Vector arrivalAgent = new Vector();
				arrivalAgent = forecastSchedualBean.getArrivalsDetails();
				request.setAttribute("agentDayBeans", arrivalAgent);
			}

			result = mapping.findForward("success");
		} else if (param.equals("reducing_agents")) {
			ForecastForm forecastForm = (ForecastForm) form;
			Vector masterData = new Vector();
			masterData = (Vector) request.getSession().getAttribute(
					"forecastData");
			if (masterData != null) {
				ForecastSchedualBean forecastSchedualBean = (ForecastSchedualBean) masterData
						.get(forecastForm.getIndexForSearch());
				Vector reducingAgent = new Vector();
				reducingAgent = forecastSchedualBean.getShorteningDetails();
				request.setAttribute("agentDayBeans", reducingAgent);
			}

			result = mapping.findForward("success");
		} else if (param.equals("extension_agents")) {
			ForecastForm forecastForm = (ForecastForm) form;
			Vector masterData = new Vector();
			masterData = (Vector) request.getSession().getAttribute(
					"forecastData");
			if (masterData != null) {
				ForecastSchedualBean forecastSchedualBean = (ForecastSchedualBean) masterData
						.get(forecastForm.getIndexForSearch());
				Vector extensionAgent = new Vector();
				extensionAgent = forecastSchedualBean.getExtensionDetails();
				request.setAttribute("agentDayBeans", extensionAgent);
			}

			result = mapping.findForward("success");
		} else if (param.equals("shifting_agents")) {
			ForecastForm forecastForm = (ForecastForm) form;
			Vector masterData = new Vector();
			masterData = (Vector) request.getSession().getAttribute(
					"forecastData");
			if (masterData != null) {
				ForecastSchedualBean forecastSchedualBean = (ForecastSchedualBean) masterData
						.get(forecastForm.getIndexForSearch());
				Vector shiftingAgent = new Vector();
				shiftingAgent = forecastSchedualBean.getShiftingDetails();
				request.setAttribute("agentDayBeans", shiftingAgent);
			}

			result = mapping.findForward("success");
		}
		else if("activitySwitch".equals(param)){ // Igal 5.2013
			ForecastForm forecastForm = (ForecastForm) form;
			Vector masterData = new Vector();
			masterData = (Vector) request.getSession().getAttribute(
					"forecastData");
			if (masterData != null) {
				ForecastSchedualBean forecastSchedualBean = (ForecastSchedualBean) masterData
						.get(forecastForm.getIndexForSearch());
				Vector<AgentDayBean> mokedSwitchesLeft = new Vector<AgentDayBean>();
				Vector<AgentDayBean> mokedSwitchesArrived = new Vector<AgentDayBean>();
				mokedSwitchesLeft = forecastSchedualBean.getVecMokedSwitchesLeft();
				mokedSwitchesArrived = forecastSchedualBean.getVecMokedSwitchesArrived();
				request.setAttribute("mokedSwitchesLeft", mokedSwitchesLeft);
				request.setAttribute("mokedSwitchesArrived", mokedSwitchesArrived);
				request.setAttribute("forecastForm", forecastForm);
			}
			
			result = mapping.findForward("success");
		}
		else if (param.equals("extra_agents")) {
			ForecastForm forecastForm = (ForecastForm) form;
			Vector masterData = new Vector();
			masterData = (Vector) request.getSession().getAttribute(
					"forecastData");
			if (masterData != null) {
				ForecastSchedualBean forecastSchedualBean = (ForecastSchedualBean) masterData
						.get(forecastForm.getIndexForSearch());
				Vector extraAgent = new Vector();
				extraAgent = forecastSchedualBean.getExtraDetails();
				request.setAttribute("agentDayBeans", extraAgent);
			}

			result = mapping.findForward("success");
		} else if (param.equals("cancel_agents")) {
			ForecastForm forecastForm = (ForecastForm) form;
			Vector masterData = new Vector();
			masterData = (Vector) request.getSession().getAttribute(
					"forecastData");
			if (masterData != null) {
				ForecastSchedualBean forecastSchedualBean = (ForecastSchedualBean) masterData
						.get(forecastForm.getIndexForSearch());
				Vector cancelAgent = new Vector();
				cancelAgent = forecastSchedualBean.getCancelDetails();
				request.setAttribute("agentDayBeans", cancelAgent);
			}

			result = mapping.findForward("success");
		}

		return result;
	}

}
