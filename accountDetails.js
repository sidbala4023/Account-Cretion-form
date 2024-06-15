import { LightningElement, wire ,api} from 'lwc';
import getParentAccount from '@salesforce/apex/AccountHelper.getParentAccount';
import ACCOUNT_OBJECT from '@salesforce/schema/Account';
import ACCOUNT_ID from '@salesforce/schema/Account.Id';
import PARENT_FIELD from '@salesforce/schema/Account.ParentId';
import NAME_FIELD from '@salesforce/schema/Account.Name';
import SLA_DAT_FILED from '@salesforce/schema/Account.SLAExpirationDate__c';
import SLA_FIELD from '@salesforce/schema/Account.SLA__c';
import NO_OF_LOC_FIELD from '@salesforce/schema/Account.NumberofLocations__c';
import DESC_FIELD from '@salesforce/schema/Account.Description';
import { getObjectInfo, getPicklistValues } from 'lightning/uiObjectInfoApi';
import { createRecord, deleteRecord, getFieldValue, getRecord, updateRecord } from 'lightning/uiRecordApi';
import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';


const fieldsToUpload =
[
    PARENT_FIELD, NAME_FIELD, SLA_DAT_FILED, SLA_FIELD, NO_OF_LOC_FIELD, DESC_FIELD 
];

export default class AccountDetails extends NavigationMixin(LightningElement)
{
    parentoptions = [];
    selectedParent = '';
    selectedAccName = '';
    selectedSlaDt = null;
    selectedSlaType = '';
    selectedNoOfLoc = '1';
    selectedDes = '';
    @api recordId;

    @wire(getRecord,
        {
            recordId : '$recordId',
            fields : fieldsToUpload
        }
    )wiredGetRecord({data,error})
    {
        if(data)
            {
                console.log('Success',data);
                this.selectedParent = getFieldValue(data,PARENT_FIELD);
                this.selectedAccName = getFieldValue(data,NAME_FIELD);
                this.selectedSlaDt = getFieldValue(data,SLA_DAT_FILED);
                this.selectedSlaType = getFieldValue(data,SLA_FIELD);
                this.selectedNoOfLoc = getFieldValue(data,NO_OF_LOC_FIELD);
                this.selectedDes = getFieldValue(data,DESC_FIELD);
            }
        else if(error)
        {
            console.log('Error',error);
        }
    }

    @wire(getParentAccount)wiredParent({data,error})
    {

        if(data)
            {

                this.parentoptions = data.map((currentItem)=>({
                    label : currentItem.Name,
                    value : currentItem.Id
                }));
            }
        else if(error)
            {
                console.log('Error',error);
            }
    }

    handleChange(event)
    {
        let {name,value} = event.target;

        if(name == 'parentAcc')
            {
                this.selectedParent = value;
            }

        if(name == 'accName')
            {
                this.selectedAccName = value;
            }

        if(name == 'slaexpdt')
            {
                this.selectedSlaDt = value;
            }

        if(name == 'slaradio')
            {
                this.selectedSlaType = value;
            }

        if(name == 'noOfLoc')
            {
                this.selectedNoOfLoc = value;
            }

        if(name == 'description')
            {
                this.selectedDes = value;
            }
    }

    @wire(getObjectInfo,
        {
            objectApiName : ACCOUNT_OBJECT
        }
    )accountInfo;

    @wire(getPicklistValues,
        {
            recordTypeId : '$accountInfo.data.defaultRecordTypeId',
            fieldApiName : SLA_FIELD
        }
    )picklists;

    saveRecord(event)
    {
        if(this.validateInput)
            {

                let inputFields = {};
                inputFields[PARENT_FIELD.fieldApiName] = this.selectedParent;
                inputFields[NAME_FIELD.fieldApiName] = this.selectedAccName;
                inputFields[SLA_DAT_FILED.fieldApiName] = this.selectedSlaDt;
                inputFields[SLA_FIELD.fieldApiName] = this.selectedSlaType;
                inputFields[NO_OF_LOC_FIELD.fieldApiName] = this.selectedNoOfLoc;
                inputFields[DESC_FIELD.fieldApiName] = this.selectedDes;
                
                if(this.recordId)
                    {
                        inputFields[ACCOUNT_ID.fieldApiName] = this.recordId;

                        let recordInput = 
                        {
                            fields :inputFields
                        }

                        updateRecord(recordInput).then((result)=>
                            {
                                console.log('Result',result);
                                this.showToast();
                            })
                        .catch((error)=>
                            {
                                console.log('Error',error);
                            })
                    }
                else
                {
                    let recordInput = 
                {
                    apiName: ACCOUNT_OBJECT.objectApiName,
                    fields: inputFields
                };

                createRecord(recordInput).then
                ((result)=>
                {
                    console.log('Account data',result);
                    let pageref = {
                        type: 'standard__recordPage',
                        attributes: {
                            recordId: result.id,
                            objectApiName: ACCOUNT_OBJECT.objectApiName,
                            actionName: 'view'
                        }                      
                    };
                    this[NavigationMixin.Navigate](pageref);
                })
                .catch((error)=>
                {
                    console.log('Account Error',error);
                });  
                }

                              
            }
        else
        {
            console.log('Input are Not valid');
        }
    }

    validateInput()
    {
        let fieldslist =Array.from(this.template.querySelectorAll('.validateme'));
        let isValid = fieldslist.every((currentItem)=>currentItem.checkValidity());
        return isValid;
    }

    get formTitle()
    {
        if(this.recordId)
            {
                return 'Edit Account';
            }
        else
        {
            return 'Create Account';
        }
    }

    showToast() {
        const event = new ShowToastEvent({
            title: 'Success',
            message:
                'Record Update Was Successfully Compeleted',
            variant : 'success'
        });
        this.dispatchEvent(event);
    }

    get saveButton()
    {
        if(this.recordId)
            {
                return 'Update';
            }
        else
        {
            return 'Save';
        }
    }

    get isDeleteAvailable()
    {
        if(this.recordId)
            {
                return true;
            }
        else
        {
            return false;
        }
    }

    deleteHandler(event)
    {
        deleteRecord(this.recordId)
        .then(()=>
            {
                console.log('result deleted',result);

                let pageRef =
                {
                    type: 'standard__objectPage',
                    attributes: {
                        objectApiName: ACCOUNT_OBJECT.objectApiName,
                        actionName: 'list'
                    },
                    state: {
                        filterName: 'AllAccounts'
                  }
                }
                this[NavigationMixin.Navigate](pageRef);
            })
        .catch((error)=>
            {
                console.log('Error',error);
            })
    }
}